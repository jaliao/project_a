/*
 * ----------------------------------------------
 * Server Actions - 認證相關
 * 2026-03-23 (Updated: 2026-09-03)
 * app/actions/auth.ts
 *
 * cr-spec-260903-001：僅 changePassword 的訊息 i18n key 化（個人資料頁變更密碼卡）
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSpiritId, deriveLoginHandle } from '@/lib/spirit-id'
import {
  sendTempPasswordEmail,
  sendPasswordResetEmail,
} from '@/lib/mailer'
import { resolveContactEmail } from '@/lib/utils/contact-email'
import {
  registerSchema,
  changePasswordSchema,
  setInitialPasswordSchema,
  loginHandleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  completeRegistrationSchema,
} from '@/lib/schemas/auth'
import { onboardingProfileSchema } from '@/lib/schemas/profile'
import { getAppUrl } from '@/lib/utils/app-url'
import {
  getValidResetToken,
  markTokenUsed,
} from '@/lib/data/password-reset'
import { getValidInviteToken } from '@/lib/data/proxy-invite'

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
// 姓名等基本資料須與 Email 同一次驗證通過才建立帳號，驗證不通過時不建立任何 User 紀錄
export async function registerWithEmail(
  formData: FormData
): Promise<ActionResponse> {
  const churchIdRaw = formData.get('churchId')
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    realName: formData.get('realName'),
    phone: formData.get('phone'),
    gender: formData.get('gender'),
    birthYear: formData.get('birthYear'),
    churchType: formData.get('churchType'),
    churchId: churchIdRaw ? Number(churchIdRaw) : null,
    churchOther: formData.get('churchOther'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { email, realName, phone, gender, birthYear, churchType, churchId, churchOther } = parsed.data

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
      loginHandle: deriveLoginHandle(spiritId),
      realName,
      phone,
      gender,
      birthYear,
      churchType,
      churchId: churchType === 'church' ? (churchId ?? null) : null,
      churchOther: churchType === 'other' ? (churchOther?.trim() || null) : null,
    },
  })

  // 寄送臨時密碼通知信（不阻塞主流程）
  // 新帳號尚無已驗證通訊 Email → 收件地址依規則退回帳號 Email
  const to = resolveContactEmail({ email })
  if (to) {
    sendTempPasswordEmail(to, spiritId, tempPassword).catch((err) => {
      console.error('[registerWithEmail] 寄信失敗：', err)
    })
  }

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

// ── 會員主動變更密碼（不修改 isTempPassword）────
// cr-spec-260903-001：個人資料頁「變更密碼」卡使用，訊息改回傳 i18n key（changeTempPassword 不在範圍）
export async function changePassword(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'profile.toast.mustLogin' }
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
    return { success: false, message: 'profile.toast.passwordAccountUnsupported' }
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { success: false, errors: { currentPassword: ['validation.currentPasswordWrong'] } }
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return { success: true, message: 'profile.toast.passwordUpdated' }
}

// ── 全新 LINE 使用者 onboarding：設定登入密碼（選填）─────
// cr-feat-261021-004：僅限尚未設定密碼（passwordHash 為 null）的帳號；
// 已有密碼者請使用 changePassword（本 action 不做「變更」語意，避免略過目前密碼確認）
export async function setInitialPassword(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'profile.toast.mustLogin' }
  }

  const parsed = setInitialPasswordSchema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return { success: false, message: 'profile.toast.mustLogin' }
  }
  if (user.passwordHash) {
    return { success: false, message: 'profile.toast.passwordAlreadySet' }
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, isTempPassword: false },
  })

  return { success: true, message: 'profile.toast.passwordUpdated' }
}

// ── 修改帳號代碼（cr-feat-261021-004）────────────
// 格式與唯一性檢查 + 30 天改名冷卻（首次手動修改不受限：handleChangedAt 為 null 時視為未改過）
const HANDLE_COOLDOWN_DAYS = 30

export async function changeLoginHandle(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'profile.toast.mustLogin' }
  }

  const parsed = loginHandleSchema.safeParse(formData.get('loginHandle'))
  if (!parsed.success) {
    return { success: false, errors: { loginHandle: parsed.error.flatten().formErrors } }
  }
  const nextHandle = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, loginHandle: true, handleChangedAt: true },
  })
  if (!user) {
    return { success: false, message: 'profile.toast.mustLogin' }
  }

  if (nextHandle === user.loginHandle) {
    return { success: false, errors: { loginHandle: ['validation.loginHandleSameAsCurrent'] } }
  }

  if (user.handleChangedAt) {
    const cooldownEndsAt = new Date(
      user.handleChangedAt.getTime() + HANDLE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    )
    if (cooldownEndsAt > new Date()) {
      const daysLeft = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      return {
        success: false,
        errors: { loginHandle: ['validation.loginHandleCooldown'] },
        data: { daysLeft },
      }
    }
  }

  const taken = await prisma.user.findFirst({
    where: { loginHandle: nextHandle, id: { not: user.id } },
    select: { id: true },
  })
  if (taken) {
    return { success: false, errors: { loginHandle: ['validation.loginHandleTaken'] } }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { loginHandle: nextHandle, handleChangedAt: new Date() },
  })

  return { success: true, message: 'profile.toast.loginHandleUpdated', data: { loginHandle: nextHandle } }
}

// ── Onboarding 基本資料填寫 ───────────────────
export async function completeOnboardingProfile(
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: '請先登入' }
  }

  const churchIdRaw = formData.get('churchId')
  const parsed = onboardingProfileSchema.safeParse({
    realName: formData.get('realName'),
    phone: formData.get('phone'),
    gender: formData.get('gender'),
    birthYear: formData.get('birthYear'),
    churchType: formData.get('churchType'),
    churchId: churchIdRaw ? Number(churchIdRaw) : null,
    churchOther: formData.get('churchOther'),
  })

  if (!parsed.success) {
    return {
      success: false,
      message: '部分欄位填寫有誤，請檢查後再試',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { realName, phone, gender, birthYear, churchType, churchId, churchOther } = parsed.data

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      realName,
      phone,
      gender,
      birthYear,
      churchType,
      churchId: churchType === 'church' ? (churchId ?? null) : null,
      churchOther: churchType === 'other' ? (churchOther?.trim() || null) : null,
    },
  })

  return { success: true, message: '基本資料已儲存' }
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
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, commEmail: true, isCommVerified: true },
  })
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 小時

    await prisma.passwordResetToken.create({
      data: { token, email, expiresAt },
    })

    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`
    // 收件地址依規則：優先已驗證通訊 Email，否則帳號 Email；兩者皆無則無法寄信，略過
    const to = resolveContactEmail(user)
    if (to) {
      sendPasswordResetEmail(to, resetUrl).catch((err) => {
        console.error('[requestPasswordReset] 寄信失敗：', err)
      })
    }
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

// ── 代填學員完成註冊：設定密碼並解除代填狀態（同一筆 User，不建立新帳號） ──
export async function completeProxyRegistration(
  formData: FormData
): Promise<ActionResponse> {
  const parsed = completeRegistrationSchema.safeParse({
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const { token, newPassword } = parsed.data

  const inviteToken = await getValidInviteToken(token)
  if (!inviteToken) {
    return { success: false, message: '邀請連結已失效，請聯繫啟動事工同工或是授課老師重新發送邀請' }
  }

  const user = await prisma.user.findUnique({ where: { id: inviteToken.userId } })
  if (!user || !user.isProxyMember) {
    return { success: false, message: '邀請連結已失效，請聯繫啟動事工同工或是授課老師重新發送邀請' }
  }

  const newHash = await bcrypt.hash(newPassword, 12)

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, isProxyMember: false, email: inviteToken.email },
      }),
      prisma.proxyInviteToken.update({
        where: { id: inviteToken.id },
        data: { usedAt: new Date() },
      }),
    ])
  } catch (err: unknown) {
    const isUniqueViolation =
      typeof err === 'object' && err !== null &&
      'code' in err && (err as { code: string }).code === 'P2002'
    if (isUniqueViolation) {
      return { success: false, message: '此 Email 已被使用，請聯繫老師確認' }
    }
    console.error('[completeProxyRegistration] 完成註冊失敗：', err)
    return { success: false, message: '完成註冊失敗，請稍後再試' }
  }

  return { success: true, message: '註冊完成，請使用新密碼登入' }
}
