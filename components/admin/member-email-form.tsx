/*
 * ----------------------------------------------
 * MemberEmailForm - 後台會員帳號修改（特殊設定）
 * 2026-07-14
 * components/admin/member-email-form.tsx
 *
 * 顯示目前登入 email、輸入新 email，確認視窗後生效
 * （行為依 account-email-change 共通規則；可對 Google-only 會員操作）
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { changeMemberEmailAdmin } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export function MemberEmailForm({ userId, currentEmail }: { userId: string; currentEmail: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await changeMemberEmailAdmin(userId, newEmail)
      setConfirmOpen(false)
      if (res.success) {
        toast.success(res.message ?? '帳號已更新')
        setNewEmail('')
        router.refresh()
      } else {
        const fieldError = res.errors?.email?.[0]
        if (fieldError) setError(fieldError)
        else toast.error(res.message ?? '更新失敗')
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="text-muted-foreground">目前帳號：</span>
        <span className="font-medium break-all">{currentEmail}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="新帳號 Email"
          className="w-full sm:w-72"
        />
        <Button
          variant="outline"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending || newEmail.trim() === ''}
        >
          修改帳號
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        變更登入帳號（含 Google 登入會員可代改）；不影響通訊 Email、Google 綁定與課程資料，不另寄通知信。
      </p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認修改會員登入帳號？</AlertDialogTitle>
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
                <p className="text-amber-700">⚠️ 確認後立即生效，該會員下次登入須使用新帳號，請告知會員。</p>
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
