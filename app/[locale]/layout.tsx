/*
 * ----------------------------------------------
 * Locale Root Layout（i18n 根佈局）
 * 2026-06-29
 * app/[locale]/layout.tsx
 *
 * 取代原 app/layout.tsx：以 next-intl 提供 <html lang>、訊息 provider。
 * 所有頁面路由置於此 [locale] 段之下（zh-TW 預設無前綴）。
 * ----------------------------------------------
 */

import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'
import { routing } from '@/i18n/routing'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { getSiteUrl } from '@/lib/utils/site-url'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// 全站根 metadata（SEO）：metadataBase／預設 title／OpenGraph／canonical／hreflang／robots。
// 註：不設 title.template——既有內頁多以完整字串「XXX — 啟動事工」設定 title，
// 加 template 會造成站名後綴重複；改為僅提供關鍵字豐富的 title.default，
// 需要後綴的內頁沿用既有「自帶站名字串」慣例（見 /courses）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })
  const siteUrl = getSiteUrl()
  const defaultTitle = t('defaultTitle')
  const description = t('description')

  return {
    metadataBase: new URL(siteUrl),
    title: defaultTitle,
    description,
    keywords: ['啟動事工', '啟動靈人', '啟動豐盛', '啟動得勝', '啟動課程', '門徒訓練'],
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical: '/',
      languages: { 'zh-TW': '/', en: '/en', 'zh-CN': '/zh-CN' },
    },
    openGraph: {
      type: 'website',
      siteName: '啟動事工',
      locale: 'zh_TW',
      url: '/',
      title: defaultTitle,
      description,
      images: ['/icon-512'],
    },
    twitter: {
      card: 'summary',
      title: defaultTitle,
      description,
    },
    robots: { index: true, follow: true },
  }
}

// PWA theme-color（對應 app/manifest.ts 的 THEME_COLOR，需手動同步）
export function generateViewport(): Viewport {
  return { themeColor: '#2563eb' }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <PwaRegister />
          {children}
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
