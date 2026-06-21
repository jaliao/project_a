/*
 * ----------------------------------------------
 * Middleware - 認證攔截
 * 2026-03-23 (Updated: 2026-04-08)
 * middleware.ts
 *
 * 功能：
 * 1. 公開路由白名單（無需登入）
 * 2. 未登入導向 /login（依 session cookie 是否存在判斷）
 *
 * 注意：isTempPassword / isProfileComplete 等業務邏輯守衛
 * 由 (user)/layout.tsx（RSC，Node.js runtime）負責，
 * 以確保永遠讀到 DB 最新值，不依賴可能過期的 JWT cache。
 * ----------------------------------------------
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isGuestCoursePath } from '@/lib/utils/guest-paths'

// 不需要登入的路徑
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/onboarding',
  '/api/auth',
  // ECPay 門市選擇 callback：ECPay 跨站 POST 回傳不帶 session cookie，須免登入放行
  '/api/ecpay/store-callback',
  '/terms',
  '/privacy',
  '/',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 以 header 傳遞目前路徑，供 RSC layout 判斷（避免 Profile 完成度守衛無限迴圈）
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } })

  // 公開路由直接放行
  if (isPublic(pathname)) return pass()

  // 課程詳情頁：未登入也放行，由頁面顯示登入提示卡片（子路徑仍受保護）
  if (isGuestCoursePath(pathname)) return pass()

  // 檢查 NextAuth session cookie（HTTPS 環境名稱不同）
  const sessionCookie =
    req.cookies.get('__Secure-authjs.session-token') ??
    req.cookies.get('authjs.session-token')

  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return pass()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
