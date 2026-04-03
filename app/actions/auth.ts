/*
 * ----------------------------------------------
 * Server Actions - 認證相關
 * 2026-03-23
 * app/actions/auth.ts
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSpiritId } from '@/lib/spirit-id'
import {
  sendTempPasswordEmail,
  sendPasswordResetEmail,
} from '@/lib/mailer'
import {
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/schemas/auth'
import {
  getValidResetToken,
  markTokenUsed,
} from '@/lib/data/password-reset'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: Record<string, unknown>
}

// ── 生成臨時密碼（[A-Za-z0-9]{12}） ─────────
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(12)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

// ── Email 自主註冊 ────────────────────────────
export async function registerWithEmail(
  formData: FormData
): Promise<ActionResponse> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { email } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, errors: { email: ['此 Email 已被使用'] } }
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)
  const spiritId = await generateSpiritId()

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      isTempPassword: true,
      spiritId,
    },
  })

  // 寄送臨時密碼通知信（不阻塞主流程）
  sendTempPasswordEmail(email, spiritId, tempPassword).catch((err) => {
    console.error('[registerWithEmail] 寄信失敗：', err)
  })

  return { success: true, message: '帳號建立成功，請查收通知信取得臨時密碼' }
}

// ── 強制變更臨時密碼 ──────────────────────────
export async function changeTempPassword(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: '請先登入' }
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.passwordHash) {
    return { success: false, message: '帳號不支援密碼登入' }
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { success: false, errors: { currentPassword: ['目前密碼不正確'] } }
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, isTempPassword: false },
    select: { spiritId: true },
  })

  return { success: true, message: '密碼已成功更新', data: { spiritId: updated.spiritId } }
}

// ── 申請密碼重設 ──────────────────────────────
export async function requestPasswordReset(
  formData: FormData
): Promise<ActionResponse> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { email } = parsed.data

  // 不洩漏帳號是否存在
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 小時

    await prisma.passwordResetToken.create({
      data: { token, email, expiresAt },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    sendPasswordResetEmail(email, resetUrl).catch((err) => {
      console.error('[requestPasswordReset] 寄信失敗：', err)
    })
  }

  return {
    success: true,
    message: '若此 Email 已註冊，將發送密碼重設信至您的信箱',
  }
}

// ── 重設密碼 ──────────────────────────────────
export async function resetPassword(
  formData: FormData
): Promise<ActionResponse> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { token, newPassword } = parsed.data

  const resetToken = await getValidResetToken(token)
  if (!resetToken) {
    return { success: false, message: '連結已失效，請重新申請' }
  }

  const user = await prisma.user.findUnique({ where: { email: resetToken.email } })
  if (!user) {
    return { success: false, message: '帳號不存在' }
  }

  const newHash = await bcrypt.hash(newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, isTempPassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true, message: '密碼已成功重設，請重新登入' }
}
