/*
 * ----------------------------------------------
 * ProxyInvitePanel - 未註冊學員邀請管理（會員首頁）
 * 2026-10-23
 * components/dashboard/proxy-invite-panel.tsx
 *
 * 取代 components/admin/member-proxy-invite-form.tsx：編輯邀請 email（核發新
 * token 並重新寄信，作廢先前未使用的 token）、或不改 email 直接「補發邀請」。
 * 顯示條件（isProxyMember 且檢視者為管理者或該班老師）由呼叫端頁面判定。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconMail } from '@tabler/icons-react'
import { updateProxyInviteEmail, resendProxyInvite } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ProxyInvitePanel({
  userId,
  currentEmail,
}: {
  userId: string
  currentEmail: string | null
}) {
  const t = useTranslations('studentProfile.proxyInvite')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState(currentEmail ?? '')
  const [error, setError] = useState<string | null>(null)

  const trimmed = email.trim()
  const emailChanged = trimmed !== (currentEmail ?? '')

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateProxyInviteEmail(userId, trimmed)
      if (res.success) {
        toast.success(res.message ?? t('sectionTitle'))
        router.refresh()
      } else {
        const fieldError = res.errors?.email?.[0]
        if (fieldError) setError(fieldError)
        else toast.error(res.message ?? t('sectionTitle'))
      }
    })
  }

  const handleResend = () => {
    setError(null)
    startTransition(async () => {
      const res = await resendProxyInvite(userId)
      if (res.success) {
        toast.success(res.message ?? t('resendButton'))
      } else {
        toast.error(res.message ?? t('resendButton'))
      }
    })
  }

  return (
    <section className="space-y-4 border-t pt-8">
      <div className="flex items-center gap-2">
        <IconMail className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">{t('sectionTitle')}</h2>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="w-full sm:w-72"
            disabled={isPending}
          />
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isPending || trimmed === '' || !emailChanged}
          >
            {t('saveButton')}
          </Button>
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={isPending || !currentEmail}
          >
            {t('resendButton')}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">{t('helperText')}</p>
      </div>
    </section>
  )
}
