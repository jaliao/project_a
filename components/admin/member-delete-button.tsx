/*
 * ----------------------------------------------
 * 會員刪除按鈕（含確認 Dialog）
 * 2026-04-01
 * components/admin/member-delete-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { deleteMember } from '@/app/actions/admin'

interface MemberDeleteButtonProps {
  userId: string
  memberName: string
}

export function MemberDeleteButton({ userId, memberName }: MemberDeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteMember(userId)
      if (result.success) {
        toast.success('會員已刪除')
        router.push('/admin/members')
      } else {
        toast.error(result.message ?? '刪除失敗，請稍後再試')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          {isPending ? '處理中…' : '刪除會員'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除會員</AlertDialogTitle>
          <AlertDialogDescription>
            確定要刪除 <span className="font-medium text-foreground">{memberName}</span> 嗎？
            <br />
            此操作不可復原，所有相關資料將一併刪除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            確認刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
