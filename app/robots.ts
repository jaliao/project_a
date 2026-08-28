/*
 * ----------------------------------------------
 * robots.txt（SEO）
 * 2026-08-28
 * app/robots.ts
 * ----------------------------------------------
 */

import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/utils/site-url'

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
