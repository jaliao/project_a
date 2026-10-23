/*
 * ----------------------------------------------
 * 代填學員完成註冊頁面
 * 2026-10-22
 * app/[locale]/(guest)/complete-registration/page.tsx
 *
 * 版型比照 (guest)/reset-password。伺服器端先驗證 token（有效、未使用、
 * 未過期、且對應帳號仍為代填狀態），無效時不顯示密碼表單（見 proxy-invite spec）。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { getActiveInviteForToken } from '@/lib/data/proxy-invite'
import { CompleteRegistrationForm } from './complete-registration-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('completeRegistration.metaTitle') }
}

export default async function CompleteRegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale } = await params
  const { token } = await searchParams
  const t = await getTranslations({ locale })

  const inviteToken = token ? await getActiveInviteForToken(token) : null
  const isValid = !!inviteToken

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
              &ldquo;{t('account.completeRegistration.quote')}&rdquo;
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
            {isValid ? (
              <CompleteRegistrationForm token={token!} />
            ) : (
              <div className="space-y-4 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t('account.completeRegistration.invalidTitle')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('account.completeRegistration.invalidDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
