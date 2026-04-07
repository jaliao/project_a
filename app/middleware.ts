/*
 * ----------------------------------------------
 * Middleware - 認證攔截
 * 2026-03-23 (Updated: 2026-04-07)
 * app/middleware.ts
 *
 * 功能：
 * 1. 公開路由白名單（無需登入）
 * 2. 未登入導向 /login
 * 3. isTempPassword = true 強制導向 /onboarding
 * 4. 注入 x-pathname header 供 (user)/layout.tsx 的 profile guard 使用
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
  '/onboarding',
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

export default auth((req: NextRequest & { auth: { user?: { isTempPassword?: boolean; isProfileComplete?: boolean; spiritId?: string | null } } | null }) => {
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

  // 臨時密碼攔截：強制導向 onboarding wizard
  if (session.user?.isTempPassword && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // Profile 完整度攔截：realName/phone 未填時導向 profile 頁
  const requireCompletion = process.env.REQUIRE_PROFILE_COMPLETION !== 'false'
  const isProfilePath = pathname.includes('/profile')
  const spiritId = session.user?.spiritId

  if (
    requireCompletion &&
    !session.user?.isProfileComplete &&
    spiritId &&
    !isProfilePath &&
    pathname !== '/onboarding'
  ) {
    return NextResponse.redirect(
      new URL(`/user/${spiritId.toLowerCase()}/profile?incomplete=1`, req.url)
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
