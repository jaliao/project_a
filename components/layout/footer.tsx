/*
 * ----------------------------------------------
 * Footer - 多欄版面（品牌欄／連結區塊／底部列含版本號）
 * 2026-07-08 (Updated: 2026-09-02)
 * components/layout/footer.tsx
 *
 * cr-spec-260902-002：由單行版本號改為 shadcnblocks footer2 風格的多欄 Footer
 * （品牌欄＋連結區塊＋底部列）。版本號（v{version} · {updatedAt}）併入底部列，
 * 與版權、法律連結同列。亦用於公開行銷頁（/、/courses、/terms、/privacy）。
 * ----------------------------------------------
 */

import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import versionInfo from '@/config/version.json'
import { BrandLogo } from '@/components/layout/brand-logo'
import { cn, APP_MAX_WIDTH } from '@/lib/utils'

type FooterLink = { key: string; href: string }
type FooterSection = { titleKey: string; links: FooterLink[] }

// 選單內容（草擬版，僅站內公開路由；日後於此單一處調整）
const SECTIONS: FooterSection[] = [
  {
    titleKey: 'sectionExplore',
    links: [
      { key: 'linkHome', href: '/' },
      { key: 'linkCourses', href: '/courses' },
      { key: 'linkInstallApp', href: '/pwa-install' },
    ],
  },
  {
    titleKey: 'sectionLegal',
    links: [
      { key: 'linkTerms', href: '/terms' },
      { key: 'linkPrivacy', href: '/privacy' },
    ],
  },
]

const LEGAL_LINKS: FooterLink[] = [
  { key: 'linkTerms', href: '/terms' },
  { key: 'linkPrivacy', href: '/privacy' },
]

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className={cn(APP_MAX_WIDTH, 'px-4 py-10 sm:px-6')}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 品牌欄 */}
          <div className="col-span-2">
            <BrandLogo textClassName="text-base" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t('description')}</p>
          </div>

          {SECTIONS.map((s) => (
            <nav key={s.titleKey} aria-label={t(s.titleKey)}>
              <h3 className="mb-3 text-sm font-semibold">{t(s.titleKey)}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {s.links.map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className="hover:text-foreground">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* 底部列：版權 · 法律連結 · 版本號（同一列） */}
        <div className="mt-8 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t('copyright', { year })}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t(l.key)}
              </Link>
            ))}
            <span className="tabular-nums">
              v{versionInfo.version} · {versionInfo.updatedAt}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
