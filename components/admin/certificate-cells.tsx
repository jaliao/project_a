/*
 * ----------------------------------------------
 * 證書製作列元件：標記完成/還原 + 備註
 * 2026-07-01
 * components/admin/certificate-cells.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  markCertificateProduced,
  unmarkCertificateProduced,
  updateCertificateNote,
} from '@/app/actions/certificate'

type Key = { userId: string; courseCatalogId: number }

export function CertificateProduceButton({ produced, ...key }: Key & { produced: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const act = () =>
    start(async () => {
      const res = produced ? await unmarkCertificateProduced(key) : await markCertificateProduced(key)
      if (res.success) {
        toast.success(res.message ?? '已更新')
        router.refresh()
      } else {
        toast.error(res.message ?? '操作失敗，請稍後再試')
      }
    })

  return (
    <Button size="sm" variant={produced ? 'outline' : 'default'} disabled={pending} onClick={act}>
      {pending ? '處理中…' : produced ? '還原' : '已完成製作'}
    </Button>
  )
}

export function CertificateNoteCell({ initialNote, ...key }: Key & { initialNote: string | null }) {
  const router = useRouter()
  const [note, setNote] = useState(initialNote ?? '')
  const [pending, start] = useTransition()
  const dirty = (note.trim() || null) !== (initialNote || null)

  const save = () =>
    start(async () => {
      const res = await updateCertificateNote(key, note)
      if (res.success) {
        toast.success(res.message ?? '已儲存備註')
        router.refresh()
      } else {
        toast.error(res.message ?? '操作失敗，請稍後再試')
      }
    })

  return (
    <div className="min-w-[10rem] space-y-1">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="text-xs"
        placeholder="備註…"
      />
      {dirty && (
        <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={save}>
          {pending ? '儲存中…' : '儲存'}
        </Button>
      )}
    </div>
  )
}
