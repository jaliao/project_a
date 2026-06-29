/*
 * ----------------------------------------------
 * LanguageSwitcher - 語言切換器
 * 2026-06-29
 * components/i18n/language-switcher.tsx
 *
 * 切換 locale 並保留當前路徑；next-intl 自動寫入 NEXT_LOCALE 偏好。
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { IconLanguage } from '@tabler/icons-react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const t = useTranslations('language')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <label className="inline-flex items-center gap-1 text-sm" aria-label={t('label')}>
      <IconLanguage className="h-4 w-4 text-muted-foreground" />
      <select
        value={locale}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value
          startTransition(() => {
            // 保留當前路徑，僅切換語言
            router.replace(pathname, { locale: next })
          })
        }}
        className="bg-transparent text-sm outline-none cursor-pointer"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {t(l)}
          </option>
        ))}
      </select>
    </label>
  )
}
