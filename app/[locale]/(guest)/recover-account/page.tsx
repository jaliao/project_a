/*
 * ----------------------------------------------
 * 找回帳號頁面（公開）
 * 2026-06-29
 * app/(auth)/recover-account/page.tsx
 *
 * 供灌檔、從未登入過的會員以中文名字找回帳號：
 * 姓名查詢 → 選擇題驗證 → 確認/修改 email → 重寄臨時密碼。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { RecoverAccountForm } from './recover-account-form'

export const metadata: Metadata = {
  title: '找回帳號 — 啟動事工',
}

export default function RecoverAccountPage() {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">

      {/* ── 左側：品牌區（lg 以上才顯示）── */}
      <div className="relative hidden lg:flex flex-col bg-zinc-900 p-10 text-white">
        <div className="flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          啟動事工
        </div>
        <div className="mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;還沒設定過帳號？輸入您的中文名字，我們協助您找回帳號。&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">— 啟動事工</footer>
          </blockquote>
        </div>
      </div>

      {/* ── 右側 / 手機全版：表單區 ── */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        <div className="flex items-center justify-between px-6 pt-6 lg:justify-end">
          <div className="flex items-center gap-2 text-base font-semibold lg:hidden">
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
            返回登入
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <RecoverAccountForm />
          </div>
        </div>
      </div>
    </div>
  )
}
