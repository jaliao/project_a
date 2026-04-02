/*
 * ----------------------------------------------
 * Middleware - 認證攔截
 * 2026-03-23
 * app/middleware.ts
 *
 * 功能：
 * 1. 公開路由白名單（無需登入）
 * 2. 未登入導向 /login
 * 3. isTempPassword = true 強制導向 /change-password
 * ----------------------------------------------
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要登入的路徑
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/api/auth',
  '/terms',
  '/privacy',
  '/',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export default auth((req: NextRequest & { auth: { user?: { isTempPassword?: boolean } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // 公開路由直接放行
  if (isPublic(pathname)) return NextResponse.next()

  // 未登入導向登入頁
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 臨時密碼攔截：強制導向變更密碼頁
  if (session.user?.isTempPassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
