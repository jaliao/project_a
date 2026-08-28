/*
 * ----------------------------------------------
 * JSON-LD 結構化資料（SEO）
 * 2026-08-28
 * components/seo/json-ld.tsx
 *
 * Server Component 內以 <script type="application/ld+json"> 直出。
 * 網址一律取自 getSiteUrl()。
 * ----------------------------------------------
 */

import { getSiteUrl } from '@/lib/utils/site-url'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonLdValue = Record<string, any>

/** 輸出一段 JSON-LD script（於 Server Component 使用） */
export function JsonLd({ data }: { data: JsonLdValue | JsonLdValue[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/** 啟動事工 Organization 節點 */
export function orgJsonLd(): JsonLdValue {
  const base = getSiteUrl()
  return {
    '@type': 'Organization',
    '@id': `${base}/#org`,
    name: '啟動事工',
    url: base,
    logo: `${base}/icon-512`,
  }
}

/** 站台 WebSite 節點 */
export function websiteJsonLd(): JsonLdValue {
  const base = getSiteUrl()
  return {
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: '啟動事工',
    url: base,
    publisher: { '@id': `${base}/#org` },
  }
}

/** 以 @context 包裝一組節點為 @graph */
export function graphJsonLd(nodes: JsonLdValue[]): JsonLdValue {
  return { '@context': 'https://schema.org', '@graph': nodes }
}
