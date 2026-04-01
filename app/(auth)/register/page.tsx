/*
 * ----------------------------------------------
 * 註冊頁面
 * 2026-03-23 (Updated: 2026-04-01)
 * app/(auth)/register/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: '建立帳號 — 啟動靈人系統',
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">

      {/* ── 左側：品牌區（lg 以上才顯示）── */}
      <div className="relative hidden lg:flex flex-col bg-zinc-900 p-10 text-white">
        {/* Logo */}
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
          啟動靈人系統
        </div>

        {/* 底部引言 */}
        <div className="mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;加入啟動靈人系統，開始您的靈命成長旅程。&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">— 系統使用者</footer>
          </blockquote>
        </div>
      </div>

      {/* ── 右側 / 手機全版：表單區 ── */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        {/* 頂部 header */}
        <div className="flex items-center justify-between px-6 pt-6 lg:justify-end">
          {/* 手機版 Logo */}
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
            啟動靈人
          </div>
          {/* 登入連結 */}
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-sm')}
          >
            登入
          </Link>
        </div>

        {/* 表單主體 */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                建立帳號
              </h1>
              <p className="text-sm text-muted-foreground">
                輸入您的 Email 或使用 Google 帳號建立帳號
              </p>
            </div>

            <RegisterForm />

            <p className="px-4 text-center text-xs text-muted-foreground">
              點擊繼續即表示您同意我們的{' '}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                服務條款
              </Link>{' '}
              與{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                隱私政策
              </Link>
              。
            </p>

            <p className="text-center text-sm text-muted-foreground">
              已有帳號？{' '}
              <Link
                href="/login"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                立即登入
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
