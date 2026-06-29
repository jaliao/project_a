/*
 * ----------------------------------------------
 * 登入頁面（shadcn Authentication 版型，Mobile First）
 * 2026-03-23 (Updated: 2026-06-29)
 * app/[locale]/(guest)/login/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'
import { UserAuthForm } from './user-auth-form'

// server 元件取用翻譯示範
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: t('loginPageTitle') }
}

export default async function LoginPage({
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
          {t('common.appName')}
        </div>

        {/* 底部引言 */}
        <div className="mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;{t('account.login.quote')}&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">— {t('account.quoteAuthor')}</footer>
          </blockquote>
        </div>
      </div>

      {/* ── 右側 / 手機全版：表單區 ── */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        {/* 頂部 header（手機 + 桌面右側） */}
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
            {t('common.appName')}
          </div>
          {/* 語言切換器 + 建立帳號連結 */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: 'ghost' }), 'text-sm')}
            >
              {t('account.login.createAccount')}
            </Link>
          </div>
        </div>

        {/* 表單主體 */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {t('account.login.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('account.login.subtitle')}
              </p>
            </div>

            <UserAuthForm />

            <p className="px-4 text-center text-xs text-muted-foreground">
              {t('account.termsAgree')}{' '}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t('account.terms')}
              </Link>{' '}
              {t('account.and')}{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t('account.privacy')}
              </Link>
            </p>

            <p className="text-center text-sm text-muted-foreground">
              {t('account.login.noAccount')}{' '}
              <Link
                href="/register"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                {t('account.login.registerNow')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
