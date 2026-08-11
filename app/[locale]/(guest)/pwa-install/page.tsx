/*
 * ----------------------------------------------
 * PWA 安裝說明頁面（免登入）
 * 2026-08-11
 * app/[locale]/(guest)/pwa-install/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pwa' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  return { title: `${t('installPage.title')} — ${tCommon('appName')}` }
}

function InstallSteps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </section>
  )
}

export default async function PwaInstallPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pwa' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const iosSteps = t.raw('installPage.ios.steps') as string[]
  const androidSteps = t.raw('installPage.android.steps') as string[]
  const desktopSteps = t.raw('installPage.desktop.steps') as string[]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← {tCommon('backToHome')}
        </Link>

        <h1 className="mb-2 text-3xl font-bold">{t('installPage.title')}</h1>
        <p className="mb-10 text-sm text-muted-foreground">{t('installPage.description')}</p>

        <div className="space-y-10">
          <InstallSteps title={t('installPage.ios.title')} steps={iosSteps} />
          <InstallSteps title={t('installPage.android.title')} steps={androidSteps} />
          <InstallSteps title={t('installPage.desktop.title')} steps={desktopSteps} />
        </div>
      </div>
    </div>
  )
}
