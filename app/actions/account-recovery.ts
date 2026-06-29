/*
 * ----------------------------------------------
 * Server Actions - 找回帳號（公開流程）
 * 2026-06-29
 * app/actions/account-recovery.ts
 *
 * 流程：中文名字查詢 → 選擇題驗證身分 → 確認/修改 email → 重寄臨時密碼。
 * 僅限「未啟用」帳號（lastLoginAt 為 null 且 isTempPassword=true）。
 * ----------------------------------------------
 */

'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendTempPasswordEmail } from '@/lib/mailer'
import { resolveContactEmail } from '@/lib/utils/contact-email'
import { findInactiveByRealName, buildRecoveryQuestion, type QuestionOption } from '@/lib/data/account-recovery'
import {
  signRecoveryToken,
  verifyRecoveryToken,
} from '@/lib/utils/recovery-token'

type ActionResponse<T = undefined> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

// 選擇題嘗試次數上限
const MAX_ATTEMPTS = 3

// 統一的「請洽管理員」訊息（不揭露帳號是否存在）
const CONTACT_ADMIN = '查無可自助找回的資料，請洽管理員協助。'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(12)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

// ── Step 1：以中文名字查詢並出題 ────────────────
export async function findRecoverableAccount(
  realName: string
): Promise<ActionResponse<{ token: string; prompt: string; options: QuestionOption[] }>> {
  const name = (realName ?? '').trim()
  if (!name) return { success: false, message: '請輸入中文名字' }

  const matches = await findInactiveByRealName(name)
  // 0 筆 / 多筆同名：皆導向管理員，不揭露細節
  if (matches.length === 0) return { success: false, message: CONTACT_ADMIN }
  if (matches.length > 1) {
    return { success: false, message: '查到多筆同名資料，請洽管理員協助。' }
  }

  const account = matches[0]
  const question = await buildRecoveryQuestion(account.id)
  if (!question) return { success: false, message: CONTACT_ADMIN }

  const token = signRecoveryToken({
    stage: 'quiz',
    accountId: account.id,
    correctId: question.correctId,
    attempts: 0,
  })

  return {
    success: true,
    data: { token, prompt: question.prompt, options: question.options },
  }
}

// ── Step 2：作答驗證身分 ───────────────────────
export async function answerRecoveryQuestion(
  token: string,
  choiceId: string
): Promise<ActionResponse<{ token: string; email: string; attemptsLeft?: number }>> {
  const payload = verifyRecoveryToken(token)
  if (!payload || payload.stage !== 'quiz') {
    return { success: false, message: '驗證已逾時，請重新開始找回帳號。' }
  }

  // 答對：簽發可改 email 的 token，回傳目前 email
  if (choiceId === payload.correctId) {
    const account = await prisma.user.findUnique({
      where: { id: payload.accountId },
      select: { email: true, lastLoginAt: true, isTempPassword: true },
    })
    // 二次確認資格（避免 token 期間帳號已啟用）
    if (!account || account.lastLoginAt !== null || !account.isTempPassword) {
      return { success: false, message: CONTACT_ADMIN }
    }
    const emailToken = signRecoveryToken({ stage: 'email', accountId: payload.accountId })
    return { success: true, data: { token: emailToken, email: account.email } }
  }

  // 答錯：累加嘗試次數
  const attempts = payload.attempts + 1
  if (attempts >= MAX_ATTEMPTS) {
    return { success: false, message: '驗證失敗次數過多，請洽管理員協助。' }
  }
  const nextToken = signRecoveryToken({
    stage: 'quiz',
    accountId: payload.accountId,
    correctId: payload.correctId,
    attempts,
  })
  return {
    success: false,
    message: '答案不正確，請再試一次。',
    data: { token: nextToken, email: '', attemptsLeft: MAX_ATTEMPTS - attempts },
  }
}

// ── Step 3：確認/修改 email 並重寄臨時密碼 ──────
const emailSchema = z.string().trim().toLowerCase().email('Email 格式不正確')

export async function submitRecoveryEmail(
  token: string,
  email: string
): Promise<ActionResponse> {
  const payload = verifyRecoveryToken(token)
  if (!payload || payload.stage !== 'email') {
    return { success: false, message: '驗證已逾時，請重新開始找回帳號。' }
  }

  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    return { success: false, errors: { email: parsed.error.flatten().formErrors } }
  }
  const nextEmail = parsed.data

  const account = await prisma.user.findUnique({
    where: { id: payload.accountId },
    select: { id: true, email: true, spiritId: true, commEmail: true, isCommVerified: true, lastLoginAt: true, isTempPassword: true },
  })
  // 二次確認資格
  if (!account || account.lastLoginAt !== null || !account.isTempPassword) {
    return { success: false, message: CONTACT_ADMIN }
  }

  // email 變更時檢查未被其他帳號占用
  if (nextEmail !== account.email) {
    const taken = await prisma.user.findFirst({
      where: { email: nextEmail, id: { not: account.id } },
      select: { id: true },
    })
    if (taken) return { success: false, errors: { email: ['此 Email 已被使用'] } }
  }

  // 重產臨時密碼
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: account.id },
      data: { email: nextEmail, passwordHash, isTempPassword: true },
    })
    await tx.whitelistedEmail.upsert({
      where: { email: nextEmail },
      update: { isActive: true },
      create: { email: nextEmail, isActive: true },
    })
  })

  // 寄送臨時密碼（規則 10：優先已驗證通訊 Email，否則帳號 email）
  const to = resolveContactEmail({
    email: nextEmail,
    commEmail: account.commEmail,
    isCommVerified: account.isCommVerified,
  })
  sendTempPasswordEmail(to, account.spiritId ?? '', tempPassword).catch((err) => {
    console.error('[submitRecoveryEmail] 寄信失敗：', err)
  })

  return { success: true, message: `臨時密碼已寄至 ${nextEmail}` }
}
