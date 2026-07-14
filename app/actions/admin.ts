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
import type { UserRole, SuspendReason } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin, normalizeRoles, canAssignRole, isSuperadmin, BOOK_LABEL_BY_TEACHER_ROLE, type TeacherRole } from '@/lib/auth-roles'
import { sendTempPasswordEmail, sendTeacherRoleGrantedEmail } from '@/lib/mailer'
import { resolveContactEmail } from '@/lib/utils/contact-email'
import { createLoginableMember, generateTempPassword } from '@/lib/member-creation'
import { validateNewAccountEmail, applyAccountEmailChange } from '@/lib/account-email-change'

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
  // 收件地址依規則：優先已驗證通訊 Email，否則帳號 Email
  const to = resolveContactEmail({ email: user.email!, commEmail: user.commEmail, isCommVerified: user.isCommVerified })
  sendTempPasswordEmail(to, user.spiritId ?? '', tempPassword).catch((err) => {
    console.error('[resetMemberPassword] 寄信失敗：', err)
  })

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
    // 授予成功 → 寄通知信（已寫入；失敗僅 log，不影響授權）
    const to = resolveContactEmail(user)
    try {
      await sendTeacherRoleGrantedEmail(to, BOOK_LABEL_BY_TEACHER_ROLE[role])
    } catch (err) {
      console.error(`[grantTeacherRole] 通知信寄送失敗 (${to})：`, err)
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

/**
 * 刪除指定會員（hard delete，需管理者權限）
 */
export async function deleteMember(userId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) return { success: false, message: '找不到此會員' }

  // 依序刪除關聯資料
  await prisma.inviteEnrollment.deleteMany({ where: { userId } })
  await prisma.courseInvite.deleteMany({ where: { createdById: userId } })
  await prisma.user.delete({ where: { id: userId } })

  return { success: true, message: '會員已刪除' }
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
