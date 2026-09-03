/*
 * ----------------------------------------------
 * SignOutSection - 登出按鈕區塊
 * 2026-03-23 (Updated: 2026-09-03)
 * components/profile/sign-out-section.tsx
 *
 * cr-spec-260903-001：字串改以 profile i18n 命名空間取用
 * ----------------------------------------------
 */

'use client'

import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { IconLogout } from '@tabler/icons-react'

export function SignOutSection() {
  const t = useTranslations()

  return (
    <section className="rounded-lg border border-destructive/30 p-6 space-y-3">
      <h2 className="text-lg font-semibold text-destructive">{t('profile.signOutTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('profile.signOutDesc')}</p>
      <Button
        variant="outline"
        className="border-destructive/50 text-destructive hover:bg-destructive/5"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        <IconLogout className="h-4 w-4 mr-2" />
        {t('profile.signOut')}
      </Button>
    </section>
  )
}
