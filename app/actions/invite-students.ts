/*
 * ----------------------------------------------
 * Server Actions - 課程學員管理（課程頁）
 * 2026-07-14 (Updated: 2026-09-24)
 * app/actions/invite-students.ts
 *
 * 新增學員（僅限既有會員，透過「學員選擇元件」StudentPicker 單選、可補登結業）、
 * 移除學員，皆於單一交易內完成並寫入管理操作紀錄（AdminActionLog）。
 * 操作權限：管理者或該課建立者（canManageInvite）。
 * 移除學員須填寫必填原因，成功後 fire-and-forget 通知管理者群組（見 createNotification）。
 * 新增學員仍不寄信、不發 Inbox 通知。
 * cr-spec-260916-004：新增 searchStudentsForInvite 供 StudentPicker 模糊搜尋；
 * addStudentToInvite 改吃 userId（取代原 identifier 字串輸入）；移除 lookupMemberByIdentifier。
 * cr-spec-260924-002：addStudentToInvite 新增先修課程驗證（checkPrerequisites），
 * 不分操作者角色，被加入學員未完成先修一律拒絕。
 * ----------------------------------------------
 */

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { searchStudentCandidates, type StudentPickerCandidate } from '@/lib/data/student-picker'
import { checkPrerequisites, formatMissingPrerequisites, getPrerequisites } from '@/lib/data/course-catalog'
import { resolveMaxCapacity } from '@/lib/data/admin-settings'
import { getDefaultMaterialChoiceForUser } from '@/lib/data/material-items'
import { createNotification } from '@/app/actions/notification'
import { generateSpiritId, deriveLoginHandle } from '@/lib/spirit-id'
import { createInviteToken } from '@/lib/data/proxy-invite'
import { sendProxyInviteEmail } from '@/lib/mailer'
import { getAppUrl } from '@/lib/utils/app-url'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** 操作紀錄快照：班級編號＋課程名稱 */
function inviteSnapshot(inviteId: number, title: string): string {
  return `#${inviteId} ${title}`
}

/** 操作紀錄快照：學員姓名（含 email，無 email 則標註） */
function targetSnapshot(realName: string | null, email: string | null): string {
  return `${realName ?? '（未填）'}（${email ?? '無 Email'}）`
}

/** 管理者或該課建立者才可管理課程學員 */
function canManageInvite(
  roles: Parameters<typeof canAccessAdmin>[0],
  userId: string,
  invite: { createdById: string }
): boolean {
  return canAccessAdmin(roles) || invite.createdById === userId
}

/**
 * 依關鍵字模糊搜尋既有會員，供「學員選擇元件」（StudentPicker）使用。
 * 以 inviteId 綁定課程歸屬授權（管理者或該課建立者），避免任意講師枚舉會員資料；
 * 伺服器端依 inviteId 當下的報名名單自動排除已在該班級的學員。
 */
export async function searchStudentsForInvite(
  inviteId: number,
  query: string
): Promise<ActionResponse<{ candidates: StudentPickerCandidate[] }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { createdById: true },
  })
  if (!invite || !canManageInvite(session.user.roles, session.user.id, invite)) {
    return { success: false, message: '無權限' }
  }

  const existingEnrollments = await prisma.inviteEnrollment.findMany({
    where: { inviteId },
    select: { userId: true },
  })
  const excludeUserIds = existingEnrollments.map((e) => e.userId)

  const candidates = await searchStudentCandidates(session.user.id, query, excludeUserIds)
  return { success: true, data: { candidates } }
}

/**
 * 供「新增學員」Dialog 選定學員後查詢其教材選擇預設值（曾上過課 → 已有教材，
 * 新生 → 繁體教材），讓 Dialog 能預先選取合理選項；授權範圍同 searchStudentsForInvite。
 */
export async function getMaterialChoiceDefaultForStudent(
  inviteId: number,
  userId: string
): Promise<ActionResponse<{ defaultMaterialChoice: 'none' | 'traditional' }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { createdById: true },
  })
  if (!invite || !canManageInvite(session.user.roles, session.user.id, invite)) {
    return { success: false, message: '無權限' }
  }

  const defaultMaterialChoice = await getDefaultMaterialChoiceForUser(userId)
  return { success: true, data: { defaultMaterialChoice } }
}

const addStudentSchema = z
  .object({
    inviteId: z.number().int().positive(),
    userId: z.string().trim().min(1, '請選擇學員'),
    graduated: z.boolean().default(false),
    graduatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '結業日格式不正確')
      .optional(),
    materialChoice: z.enum(['none', 'traditional', 'simplified', 'english']).optional(),
    materialBookName: z.string().trim().optional(),
  })
  .refine((v) => !v.graduated || !!v.graduatedAt, {
    message: '請選擇結業日',
    path: ['graduatedAt'],
  })
  .refine((v) => !v.materialChoice || v.materialChoice === 'none' || !!v.materialBookName, {
    message: '請填寫教材所屬姓名',
    path: ['materialBookName'],
  })

/**
 * 對班級新增學員：僅限既有會員，透過「學員選擇元件」（StudentPicker）單選出的既有
 * userId 直接掛報名；選定後帳號若已不存在（極端邊界情況）則拒絕。
 * 勾選已結業時 graduatedAt=joinedAt=結業日；班級未結業則同交易補 completedAt。
 */
export async function addStudentToInvite(input: {
  inviteId: number
  userId: string
  graduated: boolean
  graduatedAt?: string
  materialChoice?: 'none' | 'traditional' | 'simplified' | 'english'
  materialBookName?: string
}): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = addStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const { inviteId, userId, graduated } = parsed.data
  const graduatedDate = graduated ? new Date(`${parsed.data.graduatedAt}T00:00:00`) : null

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      title: true,
      completedAt: true,
      cancelledAt: true,
      createdById: true,
      courseCatalogId: true,
    },
  })
  if (!invite) return { success: false, message: '找不到此班級' }
  if (!canManageInvite(session.user.roles, session.user.id, invite)) {
    return { success: false, message: '無權限' }
  }
  if (invite.cancelledAt) return { success: false, message: '已取消的班級無法新增學員' }

  // 人數上限：非管理者受 class_max_capacity 限制，管理者不受限
  const isAdmin = canAccessAdmin(session.user.roles)
  const { effective } = await resolveMaxCapacity(isAdmin)
  const approvedCount = await prisma.inviteEnrollment.count({
    where: { inviteId, status: 'approved' },
  })
  if (!isAdmin && approvedCount >= effective) {
    return { success: false, message: `已達班級人數上限（${effective} 人），如需超過請洽管理者` }
  }

  // 選定後、送出前帳號已不存在（極端邊界情況）：拒絕、不建立任何報名
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, realName: true, email: true },
  })
  if (!existingUser) {
    return { success: false, errors: { userId: ['所選學員不存在，請重新選擇'] } }
  }

  // 操作管理者快照
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'

  // 重複報名事前檢查（unique 約束為最終防線）
  const dup = await prisma.inviteEnrollment.findUnique({
    where: { inviteId_userId: { inviteId, userId: existingUser.id } },
    select: { id: true },
  })
  if (dup) return { success: false, errors: { userId: ['該學員已在此班級'] } }

  // 先修驗證：不分操作者角色（管理者與該課講師一律受限），檢查對象為被加入的學員本人
  const missingPrereqs = await checkPrerequisites(existingUser.id, invite.courseCatalogId)
  if (missingPrereqs.length > 0) {
    return {
      success: false,
      errors: { userId: [`需先完成${formatMissingPrerequisites(missingPrereqs)}才能加入此班級`] },
    }
  }

  // 教材選擇：呼叫端（新增學員 Dialog）帶入人工選擇值則採用，否則沿用自動判定
  // （曾在其他班級被核准過（上過課）視為已有教材，否則預設帶入繁體教材）
  const defaultMaterialChoice = await getDefaultMaterialChoiceForUser(existingUser.id)
  const resolvedMaterialChoice = parsed.data.materialChoice ?? defaultMaterialChoice
  const resolvedMaterialBookName =
    resolvedMaterialChoice === 'none' ? null : parsed.data.materialBookName ?? null

  try {
    await prisma.$transaction(async (tx) => {
      // 建立報名（補登結業時 joinedAt 對齊結業日，避免入班晚於結業）
      await tx.inviteEnrollment.create({
        data: {
          inviteId,
          userId: existingUser.id,
          status: 'approved',
          materialChoice: resolvedMaterialChoice,
          materialBookName: resolvedMaterialBookName,
          ...(graduatedDate ? { joinedAt: graduatedDate, graduatedAt: graduatedDate } : {}),
        },
      })

      // 班級未結業而補登結業 → 一併補班級結業日
      if (graduatedDate && !invite.completedAt) {
        await tx.courseInvite.update({
          where: { id: inviteId },
          data: { completedAt: graduatedDate },
        })
      }

      // 管理操作紀錄（同交易；失敗全部回滾）
      await tx.adminActionLog.create({
        data: {
          action: 'enrollment_add',
          actorId: session.user.id,
          targetUserId: existingUser.id,
          inviteId,
          actorName,
          targetName: targetSnapshot(existingUser.realName, existingUser.email),
          inviteTitle: inviteSnapshot(invite.id, invite.title),
          detail: [
            '掛既有帳號',
            graduatedDate ? `補登結業 ${fmtDate(graduatedDate)}` : null,
            graduatedDate && !invite.completedAt ? '班級一併標記結業' : null,
          ]
            .filter(Boolean)
            .join('；'),
        },
      })
    })

    revalidatePath('/admin/course-sessions')
    revalidatePath(`/course/${inviteId}`)
    return { success: true, message: '已將既有會員加入班級' }
  } catch (err) {
    console.error('[addStudentToInvite] 新增失敗：', err)
    return { success: false, message: '新增失敗，請稍後再試' }
  }
}

const addProxyStudentSchema = z
  .object({
    inviteId: z.number().int().positive(),
    realName: z.string().trim().min(1, '請填寫真實姓名'),
    gender: z.enum(['male', 'female', 'unspecified']).default('unspecified'),
    churchType: z.enum(['church', 'other', 'none']).default('none'),
    churchId: z.number().int().positive().optional().nullable(),
    churchOther: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Email 格式不正確')
      .optional()
      .or(z.literal('')),
    graduated: z.boolean().default(false),
    graduatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '結業日格式不正確')
      .optional(),
    materialChoice: z.enum(['none', 'traditional', 'simplified', 'english']).optional(),
    materialBookName: z.string().trim().optional(),
  })
  .refine((v) => !v.graduated || !!v.graduatedAt, {
    message: '請選擇結業日',
    path: ['graduatedAt'],
  })
  .refine((v) => !v.materialChoice || v.materialChoice === 'none' || !!v.materialBookName, {
    message: '請填寫教材所屬姓名',
    path: ['materialBookName'],
  })

/**
 * 對班級建立「代填學員」（未註冊）：僅填真實姓名（必填）、性別、所屬教會、選填邀請 email，
 * 系統建立一筆 isProxyMember=true 的全新 User（passwordHash 為 null、無 Account），
 * 並以該帳號建立對應報名。與既有「選定既有會員」路徑共用人數上限、補登結業、教材選擇規則，
 * 不豁免先修課程驗證——代填學員必為新生，缺少的先修課程即該課程全部先修清單。
 * 任一驗證失敗時不建立任何 User，不留下半成品帳號。
 * 填寫邀請 email 時：唯一性檢查通過後寫入 User.email，建立成功後核發 ProxyInviteToken 並寄送邀請信（見 proxy-invite）。
 */
export async function addProxyStudentToInvite(input: {
  inviteId: number
  realName: string
  gender?: 'male' | 'female' | 'unspecified'
  churchType?: 'church' | 'other' | 'none'
  churchId?: number | null
  churchOther?: string
  email?: string
  graduated: boolean
  graduatedAt?: string
  materialChoice?: 'none' | 'traditional' | 'simplified' | 'english'
  materialBookName?: string
}): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = addProxyStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const { inviteId, realName, gender, churchType, churchOther, graduated } = parsed.data
  const email = parsed.data.email || undefined
  const graduatedDate = graduated ? new Date(`${parsed.data.graduatedAt}T00:00:00`) : null

  // 邀請 Email 唯一性檢查（與既有「後台新增會員」一致的錯誤字串）
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return { success: false, errors: { email: ['此 Email 已被使用'] } }
    }
  }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      title: true,
      completedAt: true,
      cancelledAt: true,
      createdById: true,
      courseCatalogId: true,
    },
  })
  if (!invite) return { success: false, message: '找不到此班級' }
  if (!canManageInvite(session.user.roles, session.user.id, invite)) {
    return { success: false, message: '無權限' }
  }
  if (invite.cancelledAt) return { success: false, message: '已取消的班級無法新增學員' }

  // 人數上限：非管理者受 class_max_capacity 限制，管理者不受限
  const isAdmin = canAccessAdmin(session.user.roles)
  const { effective } = await resolveMaxCapacity(isAdmin)
  const approvedCount = await prisma.inviteEnrollment.count({
    where: { inviteId, status: 'approved' },
  })
  if (!isAdmin && approvedCount >= effective) {
    return { success: false, message: `已達班級人數上限（${effective} 人），如需超過請洽管理者` }
  }

  // 先修驗證：代填學員為全新建立，沒有任何歷史報名記錄，缺少的先修課程即該課程全部先修清單
  const missingPrereqs = await getPrerequisites(invite.courseCatalogId)
  if (missingPrereqs.length > 0) {
    return {
      success: false,
      errors: { realName: [`需先完成${formatMissingPrerequisites(missingPrereqs)}才能加入此班級`] },
    }
  }

  const churchIdValue = churchType === 'church' ? (parsed.data.churchId ?? null) : null
  const churchOtherValue = churchType === 'other' ? (churchOther?.trim() || null) : null

  // 操作管理者快照
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'

  // 代填學員必為新生：教材選擇沿用人工選擇值，否則預設繁體教材
  const resolvedMaterialChoice = parsed.data.materialChoice ?? 'traditional'
  const resolvedMaterialBookName =
    resolvedMaterialChoice === 'none' ? null : parsed.data.materialBookName ?? null

  // Spirit ID 於交易外核發（與既有 OAuth 首次登入建帳邏輯一致），交易內失敗僅耗用序號不留殭屍帳號
  const spiritId = await generateSpiritId()
  const loginHandle = deriveLoginHandle(spiritId)

  let createdUserId: string | undefined

  try {
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          spiritId,
          loginHandle,
          roles: ['user'],
          realName,
          gender: gender ?? 'unspecified',
          churchType: churchType ?? 'none',
          churchId: churchIdValue,
          churchOther: churchOtherValue,
          email,
          isProxyMember: true,
        },
      })
      createdUserId = newUser.id

      // 填了邀請 email 即加入白名單（比照 createLoginableMember 等既有建帳邏輯）
      if (email) {
        await tx.whitelistedEmail.upsert({
          where: { email },
          update: { isActive: true },
          create: { email, isActive: true },
        })
      }

      await tx.inviteEnrollment.create({
        data: {
          inviteId,
          userId: newUser.id,
          status: 'approved',
          materialChoice: resolvedMaterialChoice,
          materialBookName: resolvedMaterialBookName,
          ...(graduatedDate ? { joinedAt: graduatedDate, graduatedAt: graduatedDate } : {}),
        },
      })

      // 班級未結業而補登結業 → 一併補班級結業日
      if (graduatedDate && !invite.completedAt) {
        await tx.courseInvite.update({
          where: { id: inviteId },
          data: { completedAt: graduatedDate },
        })
      }

      // 管理操作紀錄（同交易；失敗全部回滾）
      await tx.adminActionLog.create({
        data: {
          action: 'enrollment_add',
          actorId: session.user.id,
          targetUserId: newUser.id,
          inviteId,
          actorName,
          targetName: targetSnapshot(realName, null),
          inviteTitle: inviteSnapshot(invite.id, invite.title),
          detail: [
            '建立代填學員（未註冊）',
            graduatedDate ? `補登結業 ${fmtDate(graduatedDate)}` : null,
            graduatedDate && !invite.completedAt ? '班級一併標記結業' : null,
          ]
            .filter(Boolean)
            .join('；'),
        },
      })
    })

    // 有填邀請 Email：交易外核發邀請 token 並寄信（fire-and-forget，失敗僅 log 不回滾已建立的帳號）
    if (email && createdUserId) {
      createInviteToken(createdUserId, email)
        .then((inviteToken) => {
          const completeUrl = `${getAppUrl()}/complete-registration?token=${inviteToken.token}`
          return sendProxyInviteEmail(email, completeUrl)
        })
        .catch((err) => {
          console.error('[addProxyStudentToInvite] 邀請信核發/寄送失敗：', err)
        })
    }

    revalidatePath('/admin/course-sessions')
    revalidatePath(`/course/${inviteId}`)
    revalidatePath('/admin/members')
    return { success: true, message: '已建立代填學員並加入班級' }
  } catch (err) {
    console.error('[addProxyStudentToInvite] 新增失敗：', err)
    return { success: false, message: '新增失敗，請稍後再試' }
  }
}

/**
 * 自班級移除學員：實體刪除報名，須填寫必填原因；刪除與操作紀錄同交易。
 * 有無教材寄送項目關聯皆可移除；成功後 fire-and-forget 通知管理者群組。
 */
export async function removeStudentFromInvite(enrollmentId: number, reason: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!reason.trim()) {
    return { success: false, errors: { reason: ['請填寫移除原因'] } }
  }

  try {
    const enrollment = await prisma.inviteEnrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        graduatedAt: true,
        invite: { select: { id: true, title: true, createdById: true } },
        user: { select: { id: true, realName: true, email: true } },
        _count: { select: { shipmentItems: true } },
      },
    })
    if (!enrollment) return { success: false, message: '找不到此報名' }
    if (!canManageInvite(session.user.roles, session.user.id, enrollment.invite)) {
      return { success: false, message: '無權限' }
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { realName: true, name: true },
    })
    const actorName = actor?.realName || actor?.name || session.user.email || '管理者'

    await prisma.$transaction(async (tx) => {
      await tx.inviteEnrollment.delete({ where: { id: enrollmentId } })
      await tx.adminActionLog.create({
        data: {
          action: 'enrollment_remove',
          actorId: session.user.id,
          targetUserId: enrollment.user.id,
          inviteId: enrollment.invite.id,
          actorName,
          targetName: targetSnapshot(enrollment.user.realName, enrollment.user.email),
          inviteTitle: inviteSnapshot(enrollment.invite.id, enrollment.invite.title),
          detail: `${
            enrollment.graduatedAt ? `移除已結業報名（結業 ${fmtDate(enrollment.graduatedAt)}）` : '移除報名'
          }；原因：${reason.trim()}`,
        },
      })
    })

    revalidatePath('/admin/course-sessions')
    revalidatePath(`/course/${enrollment.invite.id}`)

    // 通知管理者群組（fire-and-forget，失敗不影響主操作結果）
    try {
      const admins = await prisma.user.findMany({
        where: { roles: { hasSome: ['admin', 'superadmin'] } },
        select: { id: true },
      })
      const shipmentNote = enrollment._count.shipmentItems > 0 ? '\n該學員已有教材寄送紀錄，請留意後續處理。' : ''
      const body = `${inviteSnapshot(enrollment.invite.id, enrollment.invite.title)} 的學員 ${targetSnapshot(
        enrollment.user.realName,
        enrollment.user.email
      )} 已由 ${actorName} 移除。\n原因：${reason.trim()}${shipmentNote}`
      await Promise.all(admins.map((admin) => createNotification(admin.id, '學員移除通知', body)))
    } catch (e) {
      console.error('[removeStudentFromInvite] 通知管理者群組失敗：', e)
    }

    return { success: true, message: '已移除學員' }
  } catch (err) {
    console.error('[removeStudentFromInvite] 移除失敗：', enrollmentId, err)
    return { success: false, message: '移除失敗，請稍後再試' }
  }
}
