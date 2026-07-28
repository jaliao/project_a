/*
 * ----------------------------------------------
 * Server Actions - 課程學員管理（課程頁）
 * 2026-07-14 (Updated: 2026-07-17)
 * app/actions/invite-students.ts
 *
 * 新增學員（僅限既有會員，以 Email 或啟動編號查找、可補登結業）、移除學員，
 * 皆於單一交易內完成並寫入管理操作紀錄（AdminActionLog）。
 * 操作權限：管理者或該課建立者（canManageInvite）。
 * 不寄信、不發 Inbox 通知。
 * ----------------------------------------------
 */

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { findMemberByIdentifier, type MemberByIdentifier } from '@/lib/data/invite-students'
import { resolveMaxCapacity } from '@/lib/data/admin-settings'

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

/** 操作紀錄快照：學員姓名（含 email） */
function targetSnapshot(realName: string | null, email: string): string {
  return `${realName ?? '（未填）'}（${email}）`
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
 * 以 Email 或啟動編號查既有會員（新增學員表單的確認列用）
 * 以 inviteId 綁定課程歸屬授權（管理者或該課建立者），避免任意講師枚舉會員資料
 */
export async function lookupMemberByIdentifier(
  inviteId: number,
  identifier: string
): Promise<ActionResponse<{ member: MemberByIdentifier | null }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { createdById: true },
  })
  if (!invite || !canManageInvite(session.user.roles, session.user.id, invite)) {
    return { success: false, message: '無權限' }
  }

  const value = identifier.trim()
  if (!value) return { success: true, data: { member: null } }

  const member = await findMemberByIdentifier(value)
  return { success: true, data: { member } }
}

const addStudentSchema = z
  .object({
    inviteId: z.number().int().positive(),
    identifier: z.string().trim().min(1, '請輸入 Email 或啟動編號'),
    graduated: z.boolean().default(false),
    graduatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '結業日格式不正確')
      .optional(),
  })
  .refine((v) => !v.graduated || !!v.graduatedAt, {
    message: '請選擇結業日',
    path: ['graduatedAt'],
  })

/**
 * 對班級新增學員：僅限既有會員，以 Email 或啟動編號查找並直接掛報名；查無則拒絕、不建立帳號。
 * 勾選已結業時 graduatedAt=joinedAt=結業日；班級未結業則同交易補 completedAt。
 */
export async function addStudentToInvite(input: {
  inviteId: number
  identifier: string
  graduated: boolean
  graduatedAt?: string
}): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = addStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const { inviteId, identifier, graduated } = parsed.data
  const graduatedDate = graduated ? new Date(`${parsed.data.graduatedAt}T00:00:00`) : null

  const invite = await prisma.courseInvite.findUnique({
    where: { id: inviteId },
    select: { id: true, title: true, completedAt: true, cancelledAt: true, createdById: true },
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

  // 僅限既有會員：查無時直接拒絕，不建立任何新帳號
  const existingUser = await findMemberByIdentifier(identifier)
  if (!existingUser) {
    return { success: false, errors: { identifier: ['查無此會員，請確認 Email 或啟動編號'] } }
  }

  // 操作管理者快照
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'

  // 重複報名事前檢查（unique 約束為最終防線）
  const dup = await prisma.inviteEnrollment.findUnique({
    where: { inviteId_userId: { inviteId, userId: existingUser.userId } },
    select: { id: true },
  })
  if (dup) return { success: false, errors: { identifier: ['該學員已在此班級'] } }

  try {
    await prisma.$transaction(async (tx) => {
      // 建立報名（補登結業時 joinedAt 對齊結業日，避免入班晚於結業）
      await tx.inviteEnrollment.create({
        data: {
          inviteId,
          userId: existingUser.userId,
          status: 'approved',
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
          targetUserId: existingUser.userId,
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

/**
 * 自班級移除學員：實體刪除報名。
 * 有教材寄送項目關聯者拒絕；刪除與操作紀錄同交易。
 */
export async function removeStudentFromInvite(enrollmentId: number): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

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
  if (enrollment._count.shipmentItems > 0) {
    return { success: false, message: '該報名已有教材寄送紀錄，請先至教材管理處理' }
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'

  try {
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
          detail: enrollment.graduatedAt
            ? `移除已結業報名（結業 ${fmtDate(enrollment.graduatedAt)}）`
            : '移除報名',
        },
      })
    })

    revalidatePath('/admin/course-sessions')
    revalidatePath(`/course/${enrollment.invite.id}`)
    return { success: true, message: '已移除學員' }
  } catch (err) {
    console.error('[removeStudentFromInvite] 移除失敗：', err)
    return { success: false, message: '移除失敗，請稍後再試' }
  }
}
