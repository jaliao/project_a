/*
 * ----------------------------------------------
 * 課程介紹頁（免登入，SEO）
 * 2026-08-28
 * app/[locale]/(guest)/courses/page.tsx
 *
 * 對外可索引的課程介紹頁：固定引言（必含啟動靈人／啟動豐盛／啟動得勝）
 * ＋ 資料驅動課程清單（getActiveCourses）＋ Course/Organization/WebSite JSON-LD。
 * 不呼叫 auth()、不因已登入而轉走。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getActiveCourses } from '@/lib/data/course-catalog'
import { getSiteUrl } from '@/lib/utils/site-url'
import { JsonLd, orgJsonLd, websiteJsonLd, graphJsonLd } from '@/components/seo/json-ld'
import { BrandLogo } from '@/components/layout/brand-logo'
import { Footer } from '@/components/layout/footer'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'courses' })
  const title = `${t('metaTitle')} — 啟動事工`
  const description = t('metaDescription')
  return {
    title,
    description,
    alternates: {
      canonical: '/courses',
      languages: { 'zh-TW': '/courses', en: '/en/courses', 'zh-CN': '/zh-CN/courses' },
    },
    openGraph: { type: 'website', url: '/courses', title, description, images: ['/icon-512'] },
    twitter: { card: 'summary', title, description },
  }
}

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'courses' })

  const courses = await getActiveCourses()
  const base = getSiteUrl()

  const descFor = (label: string, description: string | null): string => {
    if (description && description.trim()) return description
    return t.has(`fallback.${label}`) ? t(`fallback.${label}`) : t('fallbackGeneric')
  }

  const jsonLd = graphJsonLd([
    orgJsonLd(),
    websiteJsonLd(),
    ...(courses.length > 0
      ? [
          {
            '@type': 'ItemList',
            itemListElement: courses.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Course',
                name: c.label,
                description: descFor(c.label, c.description),
                url: `${base}/courses`,
                provider: { '@id': `${base}/#org` },
              },
            })),
          },
        ]
      : []),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd data={jsonLd} />

      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" aria-label="啟動事工">
          <BrandLogo textClassName="text-lg" />
        </Link>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          {t('ctaEnroll')}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 space-y-12">
        {/* 固定引言區（不依賴 DB） */}
        <section className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('introHeading')}</h1>
          <p className="text-base leading-relaxed text-muted-foreground">{t('introBody')}</p>
        </section>

        {/* 課程清單（資料驅動） */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">{t('listHeading')}</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noCourses')}</p>
          ) : (
            <ul className="space-y-6">
              {courses.map((c) => (
                <li key={c.id} className="space-y-2 rounded-lg border p-5">
                  <h3 className="text-lg font-semibold">{c.label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {descFor(c.label, c.description)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CTA */}
        <section className="flex flex-col items-start gap-3 rounded-lg border bg-muted/30 p-6">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('ctaEnroll')}
          </Link>
          <Link
            href="/recover-account"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {t('ctaRecover')}
          </Link>
        </section>
      </main>

      {/* Footer（共用多欄） */}
      <Footer />
    </div>
  )
}
