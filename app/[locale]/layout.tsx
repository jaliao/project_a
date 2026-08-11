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
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// server 元件取用翻譯示範（metadata 在地化）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  return {
    title: t('appName'),
    description: t('appName'),
    manifest: '/manifest.webmanifest',
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
