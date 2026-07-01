/*
 * ----------------------------------------------
 * [locale] 範圍 404 頁（notFound() 觸發）
 * 2026-07-01
 * app/[locale]/not-found.tsx
 * ----------------------------------------------
 */

'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const t = useTranslations()
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 text-center shadow-sm">
        <p className="text-5xl font-bold text-muted-foreground">404</p>
        <h1 className="mt-4 text-lg font-semibold">{t('notFound.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('notFound.desc')}</p>
        <Button asChild className="mt-6 w-full">
          <Link href="/">{t('common.backToHome')}</Link>
        </Button>
      </div>
    </div>
  )
}
