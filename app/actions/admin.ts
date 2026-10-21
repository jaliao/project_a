/*
 * ----------------------------------------------
 * Server Actions - 後台管理
 * 2026-04-01
 * app/actions/admin.ts
 * ----------------------------------------------
 */

'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import type { UserRole, SuspendReason } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  canAccessAdmin,
  normalizeRoles,
  canAssignRole,
  isSuperadmin,
  hasRole,
  BOOK_LABEL_BY_TEACHER_ROLE,
  TEACHER_ROLE_BY_CATALOG,
  type TeacherRole,
} from '@/lib/auth-roles'
import { sendTempPasswordEmail, sendTeacherRoleGrantedEmail } from '@/lib/mailer'
import { resolveContactEmail } from '@/lib/utils/contact-email'
import { createLoginableMember, generateTempPassword } from '@/lib/member-creation'
import { validateNewAccountEmail, applyAccountEmailChange } from '@/lib/account-email-change'
import { searchTeacherCandidates, type TeacherPickerCandidate } from '@/lib/data/teacher-picker'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

/**
 * 管理者重設指定會員密碼：產生新臨時密碼、寄信，並回傳臨時密碼供畫面重新顯示
 */
export async function resetMemberPassword(
  userId: string
): Promise<ActionResponse<{ tempPassword: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, commEmail: true, isCommVerified: true, spiritId: true },
  })
  if (!user) return { success: false, message: '找不到此會員' }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, isTempPassword: true },
  })

  // 寄送臨時密碼通知信（不阻塞主流程）
  // 收件地址依規則：優先已驗證通訊 Email，否則帳號 Email；兩者皆無（例如僅以 LINE 登入）則無法寄信，略過
  const to = resolveContactEmail({ email: user.email, commEmail: user.commEmail, isCommVerified: user.isCommVerified })
  if (to) {
    sendTempPasswordEmail(to, user.spiritId ?? '', tempPassword).catch((err) => {
      console.error('[resetMemberPassword] 寄信失敗：', err)
    })
  }

  return {
    success: true,
    message: '密碼已重設，臨時密碼已寄至該會員信箱',
    data: { tempPassword },
  }
}

const createMemberSchema = z.object({
  realName: z.string().trim().min(1, '請輸入姓名'),
  email: z.string().trim().toLowerCase().email('Email 格式不正確'),
  roles: z
    .array(z.enum(['teacher_1', 'teacher_2', 'teacher_3', 'admin', 'superadmin']))
    .default([]),
})

/**
 * 後台新增會員：核發 spiritId、產生臨時密碼、建立可登入帳號並加入白名單
 * 回傳臨時密碼供管理者轉交（顯示一次）
 */
export async function createMember(input: {
  realName: string
  email: string
  roles: string[]
}): Promise<ActionResponse<{ tempPassword: string; spiritId: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const parsed = createMemberSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }
  const { realName, email, roles } = parsed.data

  // Email 唯一性檢查
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return { success: false, errors: { email: ['此 Email 已被使用'] } }
  }

  // 身分集合（恆含 user 基線）
  const finalRoles = normalizeRoles(roles)

  // 建帳號共用邏輯（spiritId＋臨時密碼＋白名單）
  const { spiritId, tempPassword } = await prisma.$transaction((tx) =>
    createLoginableMember(tx, { realName, email, roles: finalRoles })
  )

  revalidatePath('/admin/members')
  return {
    success: true,
    message: '會員已建立',
    data: { tempPassword, spiritId },
  }
}

/**
 * 更新會員身分集合（保留 user 基線；禁止管理者移除自己的 admin/superadmin）
 */
export async function updateMemberRoles(
  userId: string,
  roles: string[]
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const finalRoles = normalizeRoles(roles)

  // 防鎖死：管理者不可移除自己的 admin / superadmin 身分
  if (userId === session.user.id) {
    const selfRoles = session.user.roles ?? []
    const losesAdmin = selfRoles.includes('admin') && !finalRoles.includes('admin')
    const losesSuper =
      selfRoles.includes('superadmin') && !finalRoles.includes('superadmin')
    if (losesAdmin || losesSuper) {
      return { success: false, message: '無法移除自己的管理員身分' }
    }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } })
  if (!user) return { success: false, message: '找不到此會員' }

  // 權限分級：操作者對「有變動」的身分皆須具授權權限（admin 不可碰 superadmin）
  const before = new Set(user.roles as UserRole[])
  const after = new Set(finalRoles as UserRole[])
  const changed = [...new Set([...before, ...after])].filter(
    (r) => before.has(r) !== after.has(r)
  )
  for (const r of changed) {
    if (!canAssignRole(session.user.roles, r)) {
      return { success: false, message: '無權限' }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roles: finalRoles as UserRole[] },
  })

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
  return { success: true, message: '身分已更新' }
}

/**
 * 授予書籍講師身分（teacher_1~3）並寄通知信
 */
export async function grantTeacherRole(userId: string, role: TeacherRole): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAssignRole(session.user.roles, role)) return { success: false, message: '無權限' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true, email: true, commEmail: true, isCommVerified: true },
  })
  if (!user) return { success: false, message: '找不到此會員' }

  if (!(user.roles as UserRole[]).includes(role)) {
    await prisma.user.update({
      where: { id: userId },
      data: { roles: { push: role } },
    })
    // 授予成功 → 寄通知信（已寫入；失敗僅 log，不影響授權；無可用 Email 則略過寄送）
    const to = resolveContactEmail(user)
    if (to) {
      try {
        await sendTeacherRoleGrantedEmail(to, BOOK_LABEL_BY_TEACHER_ROLE[role])
      } catch (err) {
        console.error(`[grantTeacherRole] 通知信寄送失敗 (${to})：`, err)
      }
    }
  }

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
  return { success: true, message: `已授予${BOOK_LABEL_BY_TEACHER_ROLE[role]}講師身分` }
}

/**
 * 移除書籍講師身分（不寄信）
 */
export async function revokeTeacherRole(userId: string, role: TeacherRole): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAssignRole(session.user.roles, role)) return { success: false, message: '無權限' }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } })
  if (!user) return { success: false, message: '找不到此會員' }

  const next = (user.roles as UserRole[]).filter((r) => r !== role)
  await prisma.user.update({ where: { id: userId }, data: { roles: next } })

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
  return { success: true, message: `已移除${BOOK_LABEL_BY_TEACHER_ROLE[role]}講師身分` }
}

/**
 * 暫停會員（封鎖登入；記錄時間／操作人／原因）
 */
export async function suspendMember(
  userId: string,
  input: { reason: SuspendReason; note?: string }
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }
  if (userId === session.user.id) return { success: false, message: '無法暫停自己的帳號' }

  const validReasons: SuspendReason[] = ['password_leak', 'user_request', 'other']
  if (!validReasons.includes(input.reason)) {
    return { success: false, errors: { reason: ['請選擇暫停原因'] } }
  }
  const note = (input.note ?? '').trim()
  if (input.reason === 'other' && !note) {
    return { success: false, errors: { note: ['「其他原因」需填寫補充說明'] } }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return { success: false, message: '找不到此會員' }

  await prisma.user.update({
    where: { id: userId },
    data: {
      suspendedAt: new Date(),
      suspendedById: session.user.id,
      suspendReason: input.reason,
      suspendReasonNote: note || null,
    },
  })

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
  return { success: true, message: '已暫停會員' }
}

/**
 * 恢復會員（清空暫停欄位）
 */
export async function unsuspendMember(userId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return { success: false, message: '找不到此會員' }

  await prisma.user.update({
    where: { id: userId },
    data: {
      suspendedAt: null,
      suspendedById: null,
      suspendReason: null,
      suspendReasonNote: null,
    },
  })

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
  return { success: true, message: '已恢復會員' }
}

// deleteMember 刪除流程中已知會擋下刪除的外鍵約束（ON DELETE RESTRICT），對應給使用者看的中文原因
//
// 「班級仍有其他學員報名」這個情境實測確認（task 1.3）實際擋下的是 invite_enrollments_inviteId_fkey
//（deleteMember 執行 tx.courseInvite.deleteMany(...) 這一步時，若班級下還有其他學員的 InviteEnrollment
// 未清除，是這個約束先被違反；course_invites_createdById_fkey 要到 tx.user.delete(...) 這步才會檢查，
// 但那時 courseInvite.deleteMany 若已成功，該使用者名下理論上已無 CourseInvite，實務上不會觸發——
// 仍保留此 key 作為未來清理順序調整時的防呆）
const FK_RESTRICT_MESSAGES: Record<string, string> = {
  invite_enrollments_inviteId_fkey:
    '無法刪除：此會員是某個班級的建立者（講師），且班級下仍有其他學員的報名記錄。請先將該班級轉移給其他老師，或確認相關學員資料已處理後再試。',
  course_invites_createdById_fkey:
    '無法刪除：此會員是某個班級的建立者（講師），且班級下仍有其他學員的報名記錄。請先將該班級轉移給其他老師，或確認相關學員資料已處理後再試。',
  conversations_createdById_fkey:
    '無法刪除：此會員曾發起站內對話，系統保留對話記錄以維持其他參與者的歷史訊息完整，無法直接刪除此帳號。',
  conversation_messages_authorId_fkey:
    '無法刪除：此會員曾在站內對話中發過訊息，系統保留訊息記錄以維持對話完整性，無法直接刪除此帳號。',
  course_messages_authorId_fkey:
    '無法刪除：此會員曾在課程留言功能中發過留言，系統保留留言記錄，無法直接刪除此帳號。',
}
const FK_RESTRICT_FALLBACK_MESSAGE =
  '無法刪除：此會員仍有其他系統資料關聯（原因未分類），請聯繫工程人員協助確認。'

/**
 * 從 Prisma 7 + @prisma/adapter-pg 的 P2003 錯誤中取出實際違反的外鍵約束名稱。
 * 實測確認 error.meta 並非官方文件舊版描述的 { field_name }，而是巢狀於
 * error.meta.driverAdapterError.cause.constraint.index（底層 pg driver adapter 的錯誤結構）。
 */
function extractFkConstraintName(error: Prisma.PrismaClientKnownRequestError): string {
  const index = (
    error.meta as
      | { driverAdapterError?: { cause?: { constraint?: { index?: unknown } } } }
      | undefined
  )?.driverAdapterError?.cause?.constraint?.index
  return typeof index === 'string' ? index : ''
}

/**
 * 刪除指定會員（hard delete，需管理者權限）
 * 刪除與稽核紀錄（AdminActionLog，action: member_delete）同交易完成，任一方失敗即整體回滾
 * 刪除過程若因外鍵約束（RESTRICT）失敗，攔截後回傳具體中文原因（見 FK_RESTRICT_MESSAGES）
 */
export async function deleteMember(userId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, realName: true, name: true, email: true },
  })
  if (!user) return { success: false, message: '找不到此會員' }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'
  const targetName = `${user.realName || user.name || '（未填）'}（${user.email ?? '無 Email'}）`

  try {
    await prisma.$transaction(async (tx) => {
      // 依序刪除關聯資料
      await tx.inviteEnrollment.deleteMany({ where: { userId } })
      await tx.courseInvite.deleteMany({ where: { createdById: userId } })
      await tx.user.delete({ where: { id: userId } })

      // 管理操作紀錄（同交易；失敗全部回滾）
      await tx.adminActionLog.create({
        data: {
          action: 'member_delete',
          actorId: session.user.id,
          actorName,
          targetName,
          detail: '刪除會員',
        },
      })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      const constraintName = extractFkConstraintName(error)
      const message = FK_RESTRICT_MESSAGES[constraintName] ?? FK_RESTRICT_FALLBACK_MESSAGE
      console.error('[deleteMember] FK constraint violated', { userId, constraintName, error })
      return { success: false, message }
    }
    throw error // 非外鍵約束錯誤，維持原本行為往上拋，避免掩蓋未知問題
  }

  return { success: true, message: '會員已刪除' }
}

/**
 * 依「轉移班級」勾選的班級所涵蓋的課程目錄，搜尋同時具備對應書籍講師身分的候選老師，
 * 供 MemberCourseInviteTransfer 重用 StudentPicker 元件殼時當作 onSearch 查詢。
 */
export async function searchTeachersForTransfer(
  courseCatalogIds: number[],
  query: string,
  excludeUserIds: string[]
): Promise<ActionResponse<{ candidates: TeacherPickerCandidate[] }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const requiredRoles = courseCatalogIds
    .map((id) => TEACHER_ROLE_BY_CATALOG[id])
    .filter((r): r is TeacherRole => !!r)

  const candidates = await searchTeacherCandidates(requiredRoles, query, excludeUserIds)
  return { success: true, data: { candidates } }
}

/**
 * 轉移班級（CourseInvite 擁有權）給另一位老師，僅限管理者操作。
 * 目標老師須針對涉及的每個課程目錄「實際持有」對應書籍講師身分（不吃 admin/superadmin override，
 * 理由見 cr-feat-261005-001 design.md 決策 2，比照 course-session.ts 代講師開課的既有驗證模式）。
 * 於單一交易內完成異動，並針對每個被轉移的班級各寫入一筆 AdminActionLog。
 */
export async function transferCourseInvites(
  fromUserId: string,
  toUserId: string,
  inviteIds: number[]
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  if (fromUserId === toUserId) return { success: false, message: '來源老師與目標老師不可相同' }
  if (inviteIds.length === 0) return { success: false, message: '請至少選擇一個班級' }

  const invites = await prisma.courseInvite.findMany({
    where: { id: { in: inviteIds } },
    select: {
      id: true,
      title: true,
      createdById: true,
      courseCatalogId: true,
      courseCatalog: { select: { label: true } },
    },
  })
  if (invites.length !== inviteIds.length) {
    return { success: false, message: '部分班級不存在，請重新整理頁面' }
  }
  if (invites.some((i) => i.createdById !== fromUserId)) {
    return { success: false, message: '部分班級不屬於來源老師，請重新整理頁面' }
  }

  const toUser = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true, roles: true, realName: true, name: true, email: true },
  })
  if (!toUser) return { success: false, message: '找不到目標老師' }

  const requiredCatalogIds = [...new Set(invites.map((i) => i.courseCatalogId))]
  const missingLabels = requiredCatalogIds
    .filter((catalogId) => {
      const role = TEACHER_ROLE_BY_CATALOG[catalogId]
      return !role || !hasRole(toUser.roles, role)
    })
    .map((catalogId) => invites.find((i) => i.courseCatalogId === catalogId)!.courseCatalog.label)
  if (missingLabels.length > 0) {
    return {
      success: false,
      message: `目標老師須具備「${missingLabels.join('、')}」講師身分才能接收這些班級`,
    }
  }

  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { realName: true, name: true, email: true },
  })
  if (!fromUser) return { success: false, message: '找不到來源老師' }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { realName: true, name: true },
  })
  const actorName = actor?.realName || actor?.name || session.user.email || '管理者'
  const fromTeacherSnapshot = `${fromUser.realName || fromUser.name || '（未填）'}（${fromUser.email ?? '無 Email'}）`
  const toTeacherSnapshot = `${toUser.realName || toUser.name || '（未填）'}（${toUser.email ?? '無 Email'}）`

  await prisma.$transaction(async (tx) => {
    await tx.courseInvite.updateMany({
      where: { id: { in: inviteIds } },
      data: { createdById: toUserId },
    })
    for (const invite of invites) {
      await tx.adminActionLog.create({
        data: {
          action: 'course_invite_transfer',
          actorId: session.user.id,
          actorName,
          targetUserId: toUserId,
          targetName: toTeacherSnapshot,
          inviteId: invite.id,
          inviteTitle: `#${invite.id} ${invite.title}`,
          detail: `班級所有權由 ${fromTeacherSnapshot} 轉移至 ${toTeacherSnapshot}`,
        },
      })
    }
  })

  revalidatePath(`/admin/members/${fromUserId}`)
  revalidatePath(`/admin/members/${toUserId}`)
  for (const invite of invites) {
    revalidatePath(`/course/${invite.id}`)
  }

  return { success: true, message: `已將 ${invites.length} 個班級轉移給${toTeacherSnapshot}` }
}

/**
 * 管理者修改會員登入帳號 Email：免密碼確認、可對 Google-only 會員操作
 * 行為依 account-email-change 共通規則（唯一性＋白名單汰換）
 */
export async function changeMemberEmailAdmin(
  userId: string,
  newEmail: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })
  if (!user) return { success: false, message: '找不到此會員' }

  const check = await validateNewAccountEmail(user.id, user.email, newEmail)
  if (!check.ok) return { success: false, errors: check.errors }

  await applyAccountEmailChange(user.id, user.email, check.email)

  revalidatePath(`/admin/members/${userId}`)
  return { success: true, message: `帳號已更新為 ${check.email}` }
}
