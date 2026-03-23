/*
 * ----------------------------------------------
 * SignOutSection - 登出按鈕區塊
 * 2026-03-23
 * components/profile/sign-out-section.tsx
 * ----------------------------------------------
 */

'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { IconLogout } from '@tabler/icons-react'

export function SignOutSection() {
  return (
    <section className="rounded-lg border border-destructive/30 p-6 space-y-3">
      <h2 className="text-lg font-semibold text-destructive">登出</h2>
      <p className="text-sm text-muted-foreground">登出後將返回登入頁面。</p>
      <Button
        variant="outline"
        className="border-destructive/50 text-destructive hover:bg-destructive/5"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        <IconLogout className="h-4 w-4 mr-2" />
        登出
      </Button>
    </section>
  )
}
