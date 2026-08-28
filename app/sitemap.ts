/*
 * ----------------------------------------------
 * sitemap.xml（SEO）
 * 2026-08-28
 * app/sitemap.ts
 *
 * 僅列公開可索引頁；不含需登入頁、/login、/register、/course/[id]。
 * hreflang alternates 對應 zh-TW（無前綴）／en（/en）／zh-CN（/zh-CN）。
 * ----------------------------------------------
 */

import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/utils/site-url'

type PageDef = {
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}

const PAGES: PageDef[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/pwa-install', priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  return PAGES.map(({ path, priority, changeFrequency }) => {
    // '/' 的 en 版為 '/en'（非 '/en/'）；其他頁為 '/en' + path
    const enPath = path === '/' ? '/en' : `/en${path}`
    const cnPath = path === '/' ? '/zh-CN' : `/zh-CN${path}`
    return {
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          'zh-TW': `${base}${path}`,
          en: `${base}${enPath}`,
          'zh-CN': `${base}${cnPath}`,
        },
      },
    }
  })
}
