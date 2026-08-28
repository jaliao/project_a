/*
 * ----------------------------------------------
 * 站台對外正式網址（SEO 用單一來源）
 * 2026-08-28
 * lib/utils/site-url.ts
 *
 * 供 metadataBase / robots.ts / sitemap.ts / JSON-LD 組出絕對網址。
 * 與 lib/utils/app-url.ts 分工：app-url 給寄信／route handler 導向
 * （對「使用者可達位址」敏感，dev tunnel 情境多）；site-url 給「對外正式門面網址」。
 * ----------------------------------------------
 */

/**
 * 對外正式站台網址（去尾斜線）。
 * 來源優先序：NEXT_PUBLIC_SITE_URL → NEXTAUTH_URL → http://localhost:3000
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}
