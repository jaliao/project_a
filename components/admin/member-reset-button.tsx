/*
 * ----------------------------------------------
 * 會員重設密碼按鈕（含確認 Dialog）
 * 2026-04-01
 * components/admin/member-reset-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { resetMemberPassword } from '@/app/actions/admin'

interface MemberResetButtonProps {
  userId: string
  memberName: string
}

export function MemberResetButton({ userId, memberName }: MemberResetButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await resetMemberPassword(userId)
      if (result.success) {
        toast.success(result.message ?? '密碼已重設')
      } else {
        toast.error(result.message ?? '重設失敗，請稍後再試')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? '處理中…' : '重設密碼'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認重設密碼</AlertDialogTitle>
          <AlertDialogDescription>
            確定要重設 <span className="font-medium text-foreground">{memberName}</span> 的密碼嗎？
            <br />
            系統將生成臨時密碼並寄送至該會員信箱，原密碼將立即失效。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>確認重設</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
