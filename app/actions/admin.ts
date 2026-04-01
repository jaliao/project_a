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
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendTempPasswordEmail } from '@/lib/mailer'

type ActionResponse = {
  success: boolean
  message?: string
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(12)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

/**
 * 管理者重設指定會員密碼（寄送臨時密碼至該會員信箱）
 */
export async function resetMemberPassword(userId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const isAdmin =
    session.user.role === 'admin' || session.user.role === 'superadmin'
  if (!isAdmin) return { success: false, message: '無權限' }

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

  return { success: true, message: '密碼已重設，臨時密碼已寄至該會員信箱' }
}
