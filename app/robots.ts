/*
 * ----------------------------------------------
 * robots.txt（SEO）
 * 2026-08-28
 * app/robots.ts
 * ----------------------------------------------
 */

import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/utils/site-url'

// 動態產生：需於 request 時讀取執行環境的站台網址（NEXT_PUBLIC_SITE_URL / NEXTAUTH_URL），
// 不可於 build 時靜態烘焙（否則會固定成 build 環境的 localhost）。
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/user/',
        '/dashboard',
        '/onboarding',
        '/reset-password',
        '/change-password',
        '/account-suspended',
        '/invites',
        '/messages',
        '/notifications',
        '/recover-account',
        '/forgot-password',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
