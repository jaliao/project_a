/*
 * ----------------------------------------------
 * 被暫停會員登出轉址
 * 2026-06-22
 * app/api/suspended-logout/route.ts
 *
 * 被暫停的既有 session 由 (user)/layout 導向此處：
 * 清除 NextAuth session cookie 後再轉址至 /account-suspended，
 * 確保瀏覽器不殘留被暫停帳號的 session，可乾淨重新登入。
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'

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
  // 用公開網址（NEXTAUTH_URL）組轉址，避免 cloudflared 後面取到內部 localhost host
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin
  const res = NextResponse.redirect(new URL('/account-suspended', base))
  for (const name of COOKIE_NAMES) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
  return res
}
