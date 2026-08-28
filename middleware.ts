/*
 * ----------------------------------------------
 * Middleware - i18n（next-intl）+ 認證攔截
 * 2026-03-23 (Updated: 2026-06-29)
 * middleware.ts
 *
 * 順序：先以 route-access（locale 無關）判定免登入/訪客，受保護且未登入
 * 則導向帶 locale 前綴的 /login；其餘交由 next-intl 處理語言協商/前綴，
 * 並補上 x-pathname 供 RSC layout 守衛使用。
 * ----------------------------------------------
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { isPublicRoute, isGuestRoute } from '@/lib/auth/route-access'

const intlMiddleware = createMiddleware(routing)

// 取出路徑開頭的 locale 前綴（如 /en、/zh-cn），無則回空字串
function localePrefix(pathname: string): string {
  const seg = pathname.split('/')[1]
  const match = routing.locales.find((l) => l.toLowerCase() === seg?.toLowerCase())
  return match && match !== routing.defaultLocale ? `/${seg}` : ''
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 受保護路由（非公開、非訪客）且未登入 → 導向帶 locale 前綴的登入頁
  if (!isPublicRoute(pathname) && !isGuestRoute(pathname)) {
    const sessionCookie =
      req.cookies.get('__Secure-authjs.session-token') ??
      req.cookies.get('authjs.session-token')
    if (!sessionCookie) {
      const loginUrl = new URL(`${localePrefix(pathname)}/login`, req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 交由 next-intl 處理語言（協商/前綴/cookie）
  const intlResponse = intlMiddleware(req)

  // 語言協商造成的 redirect 直接沿用
  if (intlResponse.headers.has('location')) return intlResponse

  // 補上 x-pathname（供 (user)/(admin) layout 判斷訪客頁與 profile 排除）。
  // 併入 next-intl 既有的 request-header 覆寫機制（x-middleware-override-headers），避免互相覆蓋。
  // ⚠️ 依賴 Next 內部 header 機制，需於執行階段驗證（見變更說明）。
  intlResponse.headers.set('x-middleware-request-x-pathname', pathname)
  const overrides = intlResponse.headers.get('x-middleware-override-headers')
  intlResponse.headers.set(
    'x-middleware-override-headers',
    overrides ? `${overrides},x-pathname` : 'x-pathname'
  )

  return intlResponse
}

export const config = {
  // 排除 api、_next、靜態檔、PWA 特殊檔案、SEO 特殊檔案（manifest/icon/sw.js/robots.txt/sitemap.xml
  // 皆為 app/ 根層級特殊檔案，不在 [locale] 之下，不可被 next-intl 加上 locale 前綴改寫，否則會 404）；
  // 以及 Google Search Console 網站所有權驗證檔（public/google*.html，須以原路徑、原內容供 Google 抓取，
  // 不可被 i18n 前綴改寫或被未登入導向 /login）；其餘交由 middleware（含 i18n）
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots\\.txt|sitemap\\.xml|sw\\.js|icon-192|icon-512|icon$|apple-icon|google[0-9a-f]+\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
