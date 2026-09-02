/*
 * ----------------------------------------------
 * 首頁 Landing Page
 * 2026-04-02
 * app/page.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { JsonLd, orgJsonLd, websiteJsonLd, graphJsonLd } from '@/components/seo/json-ld'
import { BrandLogo } from '@/components/layout/brand-logo'
import { Footer } from '@/components/layout/footer'

// metadata 由 app/[locale]/layout.tsx 的 generateMetadata 提供（title.default／description／canonical '/' 皆已含關鍵字）

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  // 已登入使用者直接跳轉
  const session = await auth()
  if (session?.user) {
    redirect(session.user.spiritId ? `/user/${session.user.spiritId.toLowerCase()}` : '/profile')
  }

  const { locale } = await params
  const tHome = await getTranslations({ locale, namespace: 'home' })
  const tCourses = await getTranslations({ locale, namespace: 'courses' })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd data={graphJsonLd([orgJsonLd(), websiteJsonLd()])} />

      {/* ── 頂部 Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/" aria-label="啟動事工">
          <BrandLogo textClassName="text-lg" />
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'ghost' }), 'text-sm')}
        >
          登入
        </Link>
      </header>

      {/* ── 主視覺區 ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-8">

          {/* 標題 */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              啟動事工
            </h1>
            <p className="text-xl text-muted-foreground">
              {tHome('heroSubtitle')}
            </p>
          </div>

          {/* 功能說明 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
            <div className="rounded-lg border p-5 space-y-2">
              <div className="text-2xl">📋</div>
              <h3 className="font-semibold">課程管理</h3>
              <p className="text-sm text-muted-foreground">
                {tHome('featureCourseDesc')}
              </p>
            </div>
            <div className="rounded-lg border p-5 space-y-2">
              <div className="text-2xl">👥</div>
              <h3 className="font-semibold">會員管理</h3>
              <p className="text-sm text-muted-foreground">
                查詢學員資料、追蹤學習進度與課程完成狀態。
              </p>
            </div>
            <div className="rounded-lg border p-5 space-y-2">
              <div className="text-2xl">📦</div>
              <h3 className="font-semibold">教材申請</h3>
              <p className="text-sm text-muted-foreground">
                線上申請課程教材，並追蹤出貨與物流狀態。
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: 'lg' }), 'px-10')}
            >
              開始啟動
            </Link>
            <Link
              href="/courses"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {tCourses('homeLink')}
            </Link>
            {/* 灌檔且未登入過的會員：找回帳號 */}
            <Link
              href="/recover-account"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              還沒設定過帳號？找回我的帳號
            </Link>
          </div>

        </div>
      </main>

      {/* ── 底部 Footer（共用多欄）── */}
      <Footer />

    </div>
  )
}
