/*
 * ----------------------------------------------
 * Server Actions - 後台管理
 * 2026-04-01
 * app/actions/admin.ts
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canAccessAdmin, normalizeRoles } from '@/lib/auth-roles'
import { generateSpiritId } from '@/lib/spirit-id'
import { sendTempPasswordEmail } from '@/lib/mailer'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(12)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
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
    select: { id: true, email: true, spiritId: true },
  })
  if (!user) return { success: false, message: '找不到此會員' }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, isTempPassword: true },
  })

  // 寄送臨時密碼通知信（不阻塞主流程）
  sendTempPasswordEmail(user.email!, user.spiritId ?? '', tempPassword).catch((err) => {
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
  roles: z.array(z.enum(['teacher', 'admin', 'superadmin'])).default([]),
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

  // 核發 spiritId 與臨時密碼
  const spiritId = await generateSpiritId()
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        email,
        realName,
        nickname: realName,
        spiritId,
        roles: finalRoles,
        passwordHash,
        isTempPassword: true,
      },
    })
    // 加入白名單（可登入）
    await tx.whitelistedEmail.upsert({
      where: { email },
      update: { isActive: true },
      create: { email, isActive: true },
    })
  })

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

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return { success: false, message: '找不到此會員' }

  await prisma.user.update({
    where: { id: userId },
    data: { roles: finalRoles as UserRole[] },
  })

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
  return { success: true, message: '身分已更新' }
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
