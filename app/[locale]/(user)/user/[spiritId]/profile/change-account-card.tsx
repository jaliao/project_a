/*
 * ----------------------------------------------
 * ChangeAccountCard - 帳號修改卡（登入 Email 變更）
 * 2026-07-14
 * app/[locale]/(user)/user/[spiritId]/profile/change-account-card.tsx
 *
 * 有密碼者：新 email＋目前密碼＋確認視窗後立即生效；
 * Google-only（無密碼）：顯示「請洽管理員協助修改」說明卡。
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconAt } from '@tabler/icons-react'
import { changeMyAccountEmail } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ChangeAccountCard({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string
  hasPassword: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Google-only：不開放自改
  if (!hasPassword) {
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <IconAt className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">帳號修改</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          您目前以 Google 帳號登入（未設定密碼），如需修改登入帳號請洽管理員協助。
        </p>
      </div>
    )
  }

  const handleSubmit = () => {
    setErrors({})
    startTransition(async () => {
      const res = await changeMyAccountEmail(newEmail, currentPassword)
      setConfirmOpen(false)
      if (res.success) {
        toast.success(res.message ?? '帳號已更新')
        setNewEmail('')
        setCurrentPassword('')
        router.refresh()
      } else {
        if (res.errors) setErrors(res.errors)
        if (res.message) toast.error(res.message)
      }
    })
  }

  const canOpenConfirm = newEmail.trim() !== '' && currentPassword !== ''

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <IconAt className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">帳號修改</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        變更登入帳號（Email）。目前帳號：<span className="font-medium">{currentEmail}</span>
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="account-new-email">新帳號 Email</Label>
        <Input
          id="account-new-email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new@example.com"
        />
        {errors.email?.[0] && <p className="text-sm text-destructive">{errors.email[0]}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="account-current-password">目前密碼</Label>
        <Input
          id="account-current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        {errors.currentPassword?.[0] && (
          <p className="text-sm text-destructive">{errors.currentPassword[0]}</p>
        )}
      </div>
      <Button onClick={() => setConfirmOpen(true)} disabled={!canOpenConfirm || isPending}>
        修改帳號
      </Button>

      {/* 確認視窗：新舊 email 並列＋下次登入提醒 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認修改登入帳號？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <span className="text-muted-foreground">目前帳號：</span>
                  {currentEmail}
                </p>
                <p>
                  <span className="text-muted-foreground">新帳號：</span>
                  <span className="font-semibold">{newEmail.trim().toLowerCase()}</span>
                </p>
                <p className="text-amber-700">
                  ⚠️ 確認後立即生效，下次登入請使用新帳號。請務必核對新帳號拼字是否正確。
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
              {isPending ? '處理中…' : '確認修改'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
