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
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { RecoverAccountForm } from './recover-account-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'recover' })
  return { title: t('metaTitle') }
}

export default async function RecoverAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })
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
          {t('common.appName')}
        </div>
        <div className="mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;{t('recover.quote')}&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">— {t('common.appName')}</footer>
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
            {t('common.appName')}
          </div>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-sm')}
          >
            {t('common.backToLogin')}
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
