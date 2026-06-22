/*
 * ----------------------------------------------
 * 會員暫停／恢復（Client Component）
 * 2026-06-22
 * components/admin/member-suspend-section.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { suspendMember, unsuspendMember } from '@/app/actions/admin'

const REASON_LABELS: Record<string, string> = {
  password_leak: '密碼外洩',
  user_request: '使用者要求',
  other: '其他原因',
}

type Props = {
  userId: string
  suspendedAt: Date | null
  suspendReason: string | null
  suspendReasonNote: string | null
  suspendedByName: string | null
}

export function MemberSuspendSection({
  userId,
  suspendedAt,
  suspendReason,
  suspendReasonNote,
  suspendedByName,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<'password_leak' | 'user_request' | 'other'>('password_leak')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSuspend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await suspendMember(userId, { reason, note })
      if (res.success) {
        toast.success(res.message ?? '已暫停會員')
        setOpen(false)
        router.refresh()
      } else {
        setError(res.errors?.note?.[0] ?? res.errors?.reason?.[0] ?? res.message ?? '操作失敗')
      }
    })
  }

  function handleUnsuspend() {
    startTransition(async () => {
      const res = await unsuspendMember(userId)
      if (res.success) {
        toast.success(res.message ?? '已恢復會員')
        router.refresh()
      } else {
        toast.error(res.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  if (suspendedAt) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-sm">
        <p className="font-medium text-destructive">此會員已暫停（無法登入）</p>
        <p><span className="text-muted-foreground">暫停時間：</span>{suspendedAt.toLocaleString('zh-TW')}</p>
        <p><span className="text-muted-foreground">操作人員：</span>{suspendedByName ?? '—'}</p>
        <p><span className="text-muted-foreground">原因：</span>{suspendReason ? REASON_LABELS[suspendReason] ?? suspendReason : '—'}</p>
        {suspendReasonNote && <p><span className="text-muted-foreground">補充：</span>{suspendReasonNote}</p>}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={isPending} className="mt-1">恢復會員</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>恢復會員</AlertDialogTitle>
              <AlertDialogDescription>確定恢復此會員？恢復後該會員即可正常登入。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnsuspend}>確認恢復</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">暫停會員</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>暫停會員</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSuspend} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">暫停原因 *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="password_leak">密碼外洩</option>
              <option value="user_request">使用者要求</option>
              <option value="other">其他原因</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              補充說明{reason === 'other' ? ' *（其他原因必填）' : '（選填）'}
            </label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" variant="destructive" className="w-full" disabled={isPending}>
            {isPending ? '處理中…' : '確認暫停'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
