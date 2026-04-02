/*
 * ----------------------------------------------
 * Server Actions - 個人資料相關
 * 2026-03-23
 * app/actions/profile.ts
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendCommEmailVerification } from '@/lib/mailer'
import { updateProfileSchema, commEmailSchema } from '@/lib/schemas/profile'

type ActionResponse = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

// ── 更新個人資料 ──────────────────────────────
export async function updateProfile(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = updateProfileSchema.safeParse({
    realName: formData.get('realName'),
    nickname: formData.get('nickname'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    englishName: formData.get('englishName'),
    gender: formData.get('gender') || 'unspecified',
    displayNameMode: formData.get('displayNameMode') || 'chinese',
    churchType: formData.get('churchType') || 'none',
    churchId: formData.get('churchId') || null,
    churchOther: formData.get('churchOther'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { churchType, churchId, churchOther } = parsed.data

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      realName: parsed.data.realName,
      englishName: parsed.data.englishName?.trim() || null,
      nickname: parsed.data.nickname || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      gender: parsed.data.gender,
      displayNameMode: parsed.data.displayNameMode,
      churchType,
      churchId: churchType === 'church' ? (churchId ?? null) : null,
      churchOther: churchType === 'other' ? (churchOther?.trim() || null) : null,
    },
  })

  revalidatePath('/(user)/profile')
  return { success: true, message: '個人資料已更新' }
}

// ── 更新通訊 Email（觸發重驗） ────────────────
export async function updateCommEmail(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = commEmailSchema.safeParse({
    commEmail: formData.get('commEmail'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { commEmail } = parsed.data

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 小時

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { commEmail, isCommVerified: false },
    }),
    prisma.emailVerificationToken.create({
      data: { token, email: commEmail, userId: session.user.id, expiresAt },
    }),
  ])

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`
  sendCommEmailVerification(commEmail, verifyUrl).catch((err) => {
    console.error('[updateCommEmail] 寄信失敗：', err)
  })

  revalidatePath('/(user)/profile')
  return { success: true, message: '通訊 Email 已更新，請查收驗證信' }
}

// ── 驗證通訊 Email Token ──────────────────────
export async function verifyCommEmail(token: string): Promise<ActionResponse> {
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  if (!record) {
    return { success: false, message: '連結已失效，請重新發送驗證信' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { isCommVerified: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true, message: '通訊 Email 驗證成功' }
}

// ── 重發通訊 Email 驗證信 ─────────────────────
export async function resendCommVerification(): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.commEmail) {
    return { success: false, message: '尚未設定通訊 Email' }
  }
  if (user.isCommVerified) {
    return { success: false, message: '通訊 Email 已驗證' }
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.emailVerificationToken.create({
    data: { token, email: user.commEmail, userId: user.id, expiresAt },
  })

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`
  sendCommEmailVerification(user.commEmail, verifyUrl).catch((err) => {
    console.error('[resendCommVerification] 寄信失敗：', err)
  })

  return { success: true, message: '驗證信已重新發送' }
}

// ── 解除 Google 帳號連結 ─────────────────────
export async function unlinkGoogleAccount(): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true },
  })

  if (!user) return { success: false, message: '帳號不存在' }

  const googleAccount = user.accounts.find((a) => a.provider === 'google')
  if (!googleAccount) {
    return { success: false, message: '尚未連結 Google 帳號' }
  }

  // 防護：若無密碼且只有此一連結方式，禁止解除
  const otherAccounts = user.accounts.filter((a) => a.provider !== 'google')
  if (!user.passwordHash && otherAccounts.length === 0) {
    return {
      success: false,
      message: '請先設定密碼再解除連結，以免無法登入',
    }
  }

  await prisma.account.delete({ where: { id: googleAccount.id } })

  revalidatePath('/(user)/profile')
  return { success: true, message: 'Google 帳號已解除連結' }
}
