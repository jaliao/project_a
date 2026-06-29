/*
 * ----------------------------------------------
 * 路由存取單一事實來源（免登入/訪客判定）
 * 2026-06-29
 * lib/auth/route-access.ts
 *
 * 免登入頁面/API 與訪客頁的「唯一」宣告處，供 middleware 與
 * (user)/layout 共用，避免判定散落漂移。
 *
 * ⚠️ 本檔由 middleware（Edge runtime）載入：僅可用純字串/正規表達式，
 *    不得引入 prisma、Node-only API 或任何重量相依。
 *
 * 新增免登入路由時：在此註冊（附 reason），頁面放入對應 route group
 * （(guest)／(user)／(admin)）。詳見 CLAUDE.md。
 * ----------------------------------------------
 */

// 比對規則：exact＝完全相等；prefix＝相等或為其子路徑
export type RouteRule = { match: 'exact' | 'prefix'; path: string; reason: string }

// 免登入頁面
export const PUBLIC_PAGES: RouteRule[] = [
  { match: 'exact', path: '/', reason: '行銷首頁' },
  { match: 'exact', path: '/login', reason: '登入頁' },
  { match: 'exact', path: '/register', reason: '註冊頁' },
  { match: 'exact', path: '/forgot-password', reason: '忘記密碼' },
  { match: 'exact', path: '/reset-password', reason: '密碼重設（token 帶於 query）' },
  { match: 'exact', path: '/change-password', reason: '變更密碼（頁面自行 auth 守衛）' },
  { match: 'exact', path: '/recover-account', reason: '找回帳號（灌檔且未登入過會員自助）' },
  { match: 'exact', path: '/onboarding', reason: '首次登入引導（頁面自行 auth 守衛，避免守衛迴圈）' },
  { match: 'exact', path: '/account-suspended', reason: '帳號已暫停獨立頁（免登入可見）' },
  { match: 'exact', path: '/terms', reason: '服務條款' },
  { match: 'exact', path: '/privacy', reason: '隱私政策' },
]

// 免登入 API
export const PUBLIC_APIS: RouteRule[] = [
  { match: 'prefix', path: '/api/auth', reason: 'NextAuth 端點' },
  { match: 'prefix', path: '/api/ecpay/store-callback', reason: 'ECPay 門市選擇 callback：跨站 POST 不帶 session cookie' },
  { match: 'prefix', path: '/api/suspended-logout', reason: '被暫停會員登出轉址（清 session 後導向 /account-suspended）' },
  { match: 'prefix', path: '/api/verify-email', reason: '通訊 Email 驗證連結：點擊時可能未登入' },
]

// 訪客頁：需登入體驗但未登入也可進，由頁面顯示登入提示卡片
export const GUEST_PAGES: RegExp[] = [
  // 課程詳情頁：僅數字 id，不含子路徑（如 /course/123/graduate 不符）
  /^\/course\/\d+$/,
]

// i18n：app/[locale]/ 的 locale 前綴（與 i18n/routing.ts 對齊；預設 zh-TW 無前綴）
const LOCALES = ['zh-TW', 'en', 'zh-CN'] as const
const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`, 'i')

/**
 * 剝除可能的 locale 前綴（如 /en/login → /login）。
 * 目前尚未導入 i18n，無前綴時原樣返回。
 */
export function stripLocale(pathname: string): string {
  const stripped = pathname.replace(LOCALE_PREFIX, '')
  return stripped === '' ? '/' : stripped
}

function matchRule(pathname: string, rule: RouteRule): boolean {
  if (rule.match === 'exact') return pathname === rule.path
  return pathname === rule.path || pathname.startsWith(rule.path + '/')
}

/**
 * 是否為免登入路由（頁面或 API）。
 */
export function isPublicRoute(pathname: string): boolean {
  const p = stripLocale(pathname)
  return (
    PUBLIC_PAGES.some((r) => matchRule(p, r)) ||
    PUBLIC_APIS.some((r) => matchRule(p, r))
  )
}

/**
 * 是否為訪客頁（未登入可進、由頁面顯示登入提示）。
 */
export function isGuestRoute(pathname: string): boolean {
  const p = stripLocale(pathname)
  return GUEST_PAGES.some((re) => re.test(p))
}
