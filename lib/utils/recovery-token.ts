/*
 * ----------------------------------------------
 * 找回帳號短效簽章 Token
 * 2026-06-29
 * lib/utils/recovery-token.ts
 *
 * 公開（無 session）找回帳號流程，於各步驟間以 HMAC 簽章 token
 * 攜帶狀態（帳號 id、題目正解、嘗試次數），防止前端竄改與重放。
 * ----------------------------------------------
 */

import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-recovery-secret'

// 驗證題階段：攜帶正解與已嘗試次數
export type QuizTokenPayload = {
  stage: 'quiz'
  accountId: string
  correctId: string
  attempts: number
  exp: number // epoch 毫秒
}

// 通過驗證階段：可進入確認/修改 email
export type EmailTokenPayload = {
  stage: 'email'
  accountId: string
  exp: number
}

export type RecoveryTokenPayload = QuizTokenPayload | EmailTokenPayload

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url')
}

/**
 * 簽發 token：payload（不含簽章）以 base64url 編碼後附 HMAC 簽章。
 * ttlSeconds 預設 15 分鐘。
 */
export function signRecoveryToken(
  payload: Omit<QuizTokenPayload, 'exp'> | Omit<EmailTokenPayload, 'exp'>,
  ttlSeconds = 15 * 60
): string {
  const full = { ...payload, exp: Date.now() + ttlSeconds * 1000 }
  const body = base64url(JSON.stringify(full))
  return `${body}.${sign(body)}`
}

/**
 * 驗證 token：簽章不符、格式錯誤或已過期回傳 null。
 */
export function verifyRecoveryToken(token: string | null | undefined): RecoveryTokenPayload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expected = sign(body)
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as RecoveryTokenPayload
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
