/*
 * ----------------------------------------------
 * MemberProxyInviteForm - 代填學員邀請 Email 管理（特殊設定）
 * 2026-10-22
 * components/admin/member-proxy-invite-form.tsx
 *
 * 僅於 isProxyMember = true 時顯示：編輯邀請 email（核發新 token 並重新寄信，
 * 作廢先前未使用的 token）、或不改 email 直接「補發邀請」。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateProxyInviteEmail, resendProxyInvite } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function MemberProxyInviteForm({
  userId,
  currentEmail,
}: {
  userId: string
  currentEmail: string | null
}) {
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
        toast.success(res.message ?? '已更新邀請 Email')
        router.refresh()
      } else {
        const fieldError = res.errors?.email?.[0]
        if (fieldError) setError(fieldError)
        else toast.error(res.message ?? '更新失敗')
      }
    })
  }

  const handleResend = () => {
    setError(null)
    startTransition(async () => {
      const res = await resendProxyInvite(userId)
      if (res.success) {
        toast.success(res.message ?? '已重新寄送邀請信')
      } else {
        toast.error(res.message ?? '補發失敗')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="受邀學員的 Email"
          className="w-full sm:w-72"
          disabled={isPending}
        />
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isPending || trimmed === '' || !emailChanged}
        >
          儲存並寄出邀請
        </Button>
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={isPending || !currentEmail}
        >
          補發邀請
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        填寫或修改 Email 並儲存後，系統會核發新的邀請連結並寄信；「補發邀請」則以目前 Email 重新寄送，先前未使用的連結都會失效。
      </p>
    </div>
  )
}
