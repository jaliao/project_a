/*
 * ----------------------------------------------
 * 已合併帳號登出轉址
 * 2026-10-16
 * app/api/merged-logout/route.ts
 *
 * 已被標記為副帳號（mergedIntoId 非 null）的既有 session 由 (user)/layout 導向此處：
 * 清除 NextAuth session cookie 後再轉址至 /account-merged，
 * 確保瀏覽器不殘留已合併帳號的 session，可乾淨改用主帳號重新登入。
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRequestBaseUrl } from '@/lib/utils/app-url'

// NextAuth session cookie 可能的名稱（https 加 __Secure- 前綴；過長時分塊 .0/.1）
const COOKIE_NAMES = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
  '__Secure-authjs.session-token.0',
  '__Secure-authjs.session-token.1',
  'authjs.session-token.0',
  'authjs.session-token.1',
]

export function GET(req: NextRequest) {
  // 用對外網址組轉址，避免 cloudflared 後面取到內部 localhost host
  const base = getRequestBaseUrl(req)
  const res = NextResponse.redirect(new URL('/account-merged', base))
  for (const name of COOKIE_NAMES) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
  return res
}
