/*
 * ----------------------------------------------
 * Server Actions - 個人資料相關
 * 2026-03-23 (Updated: 2026-09-03)
 * app/actions/profile.ts
 *
 * cr-spec-260903-001：個人資料頁相關 action 訊息 i18n key 化
 * （updateProfile／updateCommEmail／resendCommVerification／unlinkGoogleAccount／changeMyAccountEmail；
 *  updateGender／verifyCommEmail 不在範圍，維持繁體）
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendCommEmailVerification } from '@/lib/mailer'
import { updateProfileSchema, commEmailSchema } from '@/lib/schemas/profile'
import { getAppUrl } from '@/lib/utils/app-url'
import { validateNewAccountEmail, applyAccountEmailChange } from '@/lib/account-email-change'

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
  if (!session?.user?.id) return { success: false, message: 'profile.toast.mustLogin' }

  const churchIdRaw = formData.get('churchId')
  const parsed = updateProfileSchema.safeParse({
    realName: formData.get('realName'),
    nickname: formData.get('nickname'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    englishName: formData.get('englishName'),
    gender: formData.get('gender'),
    birthYear: formData.get('birthYear'),
    displayNameMode: formData.get('displayNameMode') || 'nickname',
    churchType: formData.get('churchType') || 'none',
    // FormData 取出為字串，需轉為數字（schema 期望 number）
    churchId: churchIdRaw ? Number(churchIdRaw) : null,
    churchOther: formData.get('churchOther'),
  })

  if (!parsed.success) {
    return {
      success: false,
      message: 'profile.toast.formHasErrors',
      errors: parsed.error.flatten().fieldErrors,
    }
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
      birthYear: parsed.data.birthYear,
      displayNameMode: parsed.data.displayNameMode,
      churchType,
      churchId: churchType === 'church' ? (churchId ?? null) : null,
      churchOther: churchType === 'other' ? (churchOther?.trim() || null) : null,
    },
  })

  revalidatePath('/(user)/profile')
  return { success: true, message: 'profile.toast.profileUpdated' }
}

// ── 首頁性別補填對話框專用：僅更新單一欄位 gender（cr-spec-260803-002） ──
export async function updateGender(gender: 'male' | 'female'): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }

  const parsed = z.enum(['male', 'female']).safeParse(gender)
  if (!parsed.success) {
    return { success: false, message: '請選擇性別' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { gender: parsed.data },
  })

  if (session.user.spiritId) {
    revalidatePath(`/user/${session.user.spiritId.toLowerCase()}`)
  }
  return { success: true, message: '性別已更新' }
}

// ── 更新通訊 Email（觸發重驗） ────────────────
export async function updateCommEmail(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: 'profile.toast.mustLogin' }

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

  const verifyUrl = `${getAppUrl()}/api/verify-email?token=${token}`
  sendCommEmailVerification(commEmail, verifyUrl).catch((err) => {
    console.error('[updateCommEmail] 寄信失敗：', err)
  })

  revalidatePath('/(user)/profile')
  return { success: true, message: 'profile.toast.commEmailUpdated' }
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
  if (!session?.user?.id) return { success: false, message: 'profile.toast.mustLogin' }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.commEmail) {
    return { success: false, message: 'profile.toast.commEmailNotSet' }
  }
  if (user.isCommVerified) {
    return { success: false, message: 'profile.toast.commEmailAlreadyVerified' }
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.emailVerificationToken.create({
    data: { token, email: user.commEmail, userId: user.id, expiresAt },
  })

  const verifyUrl = `${getAppUrl()}/api/verify-email?token=${token}`
  sendCommEmailVerification(user.commEmail, verifyUrl).catch((err) => {
    console.error('[resendCommVerification] 寄信失敗：', err)
  })

  return { success: true, message: 'profile.toast.verificationResent' }
}

// ── 解除 Google 帳號連結 ─────────────────────
export async function unlinkGoogleAccount(): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: 'profile.toast.mustLogin' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true },
  })

  if (!user) return { success: false, message: 'profile.toast.accountNotFound' }

  const googleAccount = user.accounts.find((a) => a.provider === 'google')
  if (!googleAccount) {
    return { success: false, message: 'profile.toast.googleNotLinked' }
  }

  // 防護：若無密碼且只有此一連結方式，禁止解除
  const otherAccounts = user.accounts.filter((a) => a.provider !== 'google')
  if (!user.passwordHash && otherAccounts.length === 0) {
    return {
      success: false,
      message: 'profile.toast.googleUnlinkNeedsPassword',
    }
  }

  await prisma.account.delete({ where: { id: googleAccount.id } })

  revalidatePath('/(user)/profile')
  return { success: true, message: 'profile.toast.googleUnlinked' }
}

// ── 本人修改登入帳號 Email ──────────────────────
// Google-only（無密碼）不開放自改；需以目前密碼確認身分
export async function changeMyAccountEmail(
  newEmail: string,
  currentPassword: string
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: 'profile.toast.mustLogin' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, passwordHash: true },
  })
  if (!user) return { success: false, message: 'profile.toast.accountNotFound' }

  if (!user.passwordHash) {
    return { success: false, message: 'profile.toast.accountEmailGoogleOnly' }
  }

  const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!passwordOk) {
    return { success: false, errors: { currentPassword: ['validation.passwordWrong'] } }
  }

  const check = await validateNewAccountEmail(user.id, user.email, newEmail)
  if (!check.ok) {
    // validateNewAccountEmail 為 admin 共用（回傳繁體字面），此處就地映射為 i18n key，不動共用模組
    const MAP: Record<string, string> = {
      'Email 格式不正確': 'validation.emailInvalid',
      '與目前帳號相同': 'validation.emailSameAsCurrent',
      '此 Email 已被使用': 'validation.emailTaken',
    }
    const errors = Object.fromEntries(
      Object.entries(check.errors).map(([field, msgs]) => [field, msgs.map((m) => MAP[m] ?? m)])
    )
    return { success: false, errors }
  }

  await applyAccountEmailChange(user.id, user.email, check.email)

  revalidatePath('/', 'layout')
  return { success: true, message: 'profile.toast.accountEmailUpdated' }
}
