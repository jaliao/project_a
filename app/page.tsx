/*
 * ----------------------------------------------
 * 首頁 Landing Page
 * 2026-04-02
 * app/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: '啟動事工',
  description: '啟動事工 — 課程管理、會員管理與學習追蹤平台',
}

export default async function HomePage() {
  // 已登入使用者直接跳轉
  const session = await auth()
  if (session?.user) {
    redirect(session.user.spiritId ? `/user/${session.user.spiritId.toLowerCase()}` : '/profile')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── 頂部 Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          啟動事工
        </div>
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
              課程管理・會員追蹤・學習紀錄
            </p>
          </div>

          {/* 功能說明 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
            <div className="rounded-lg border p-5 space-y-2">
              <div className="text-2xl">📋</div>
              <h3 className="font-semibold">課程管理</h3>
              <p className="text-sm text-muted-foreground">
                管理啟動靈人、啟動豐盛等課程的開課紀錄與學員報名。
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
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: 'lg' }), 'px-10')}
            >
              開始啟動
            </Link>
          </div>

        </div>
      </main>

      {/* ── 底部 Footer ── */}
      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        <span>© 2026 啟動事工</span>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-foreground underline underline-offset-4">服務條款</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-foreground underline underline-offset-4">隱私政策</Link>
      </footer>

    </div>
  )
}
