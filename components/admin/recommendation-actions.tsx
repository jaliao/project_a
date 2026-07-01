/*
 * ----------------------------------------------
 * 推薦講師列操作：暫不接受 / 取消暫不接受
 * 2026-07-01
 * components/admin/recommendation-actions.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { deferRecommendation, undeferRecommendation } from '@/app/actions/recommendation'

type Status = 'pending' | 'deferred' | 'accepted'

export function RecommendationActions({ enrollmentId, status }: { enrollmentId: number; status: Status }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')

  if (status === 'accepted') return <span className="text-xs text-muted-foreground">—</span>

  if (status === 'deferred') {
    const undo = () =>
      start(async () => {
        const res = await undeferRecommendation(enrollmentId)
        if (res.success) {
          toast.success(res.message ?? '已取消')
          router.refresh()
        } else {
          toast.error(res.message ?? '操作失敗，請稍後再試')
        }
      })
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={undo}>
        {pending ? '處理中…' : '取消暫不接受'}
      </Button>
    )
  }

  // pending
  const confirm = () =>
    start(async () => {
      const res = await deferRecommendation(enrollmentId, note)
      if (res.success) {
        toast.success(res.message ?? '已暫不接受')
        setOpen(false)
        setNote('')
        router.refresh()
      } else {
        toast.error(res.message ?? '操作失敗，請稍後再試')
      }
    })

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        暫不接受
      </Button>
    )
  }
  return (
    <div className="min-w-[12rem] space-y-1">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="text-xs"
        placeholder="暫不接受備註（選填）…"
      />
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={confirm}>
          {pending ? '處理中…' : '確認暫不接受'}
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={() => { setOpen(false); setNote('') }}>
          取消
        </Button>
      </div>
    </div>
  )
}
