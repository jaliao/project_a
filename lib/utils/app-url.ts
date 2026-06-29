/*
 * ----------------------------------------------
 * 對外絕對網址建構（單一來源）
 * 2026-06-29
 * lib/utils/app-url.ts
 *
 * 對外網址一律透過此檔建構：
 * - getAppUrl()：無 request 情境（server action 寄信/通知連結），讀 NEXTAUTH_URL。
 * - getRequestBaseUrl(req)：route handler 導向，依轉發標頭還原對外 base
 *   （開發 Cloudflare Tunnel 下 req.url 的 host 會是內部 localhost，故須用 x-forwarded-host）。
 *
 * ⚠️ route handler 禁止用 req.url / req.nextUrl.origin 建對外網址（見 CLAUDE.md 第 13 條）。
 * ----------------------------------------------
 */

import type { NextRequest } from 'next/server'

/**
 * 對外 App base URL（無 request 情境用，如寄信）。
 * 來源：NEXTAUTH_URL（去尾斜線）。
 */
export function getAppUrl(): string {
  return (process.env.NEXTAUTH_URL ?? '').replace(/\/+$/, '')
}

/**
 * route handler 導向用的對外 base URL。
 * 依序：x-forwarded-host → host → NEXTAUTH_URL → req.nextUrl.origin。
 * proto 取 x-forwarded-proto（fallback https）。
 */
export function getRequestBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (forwardedHost) {
    const proto = req.headers.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${forwardedHost}`
  }
  const fromEnv = getAppUrl()
  return fromEnv || req.nextUrl.origin
}
