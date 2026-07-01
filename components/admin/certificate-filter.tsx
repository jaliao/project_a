/*
 * ----------------------------------------------
 * CertificateFilter - 證書製作清單篩選（狀態＋人名搜尋）
 * 2026-07-01
 * components/admin/certificate-filter.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function CertificateFilter({ status, q }: { status: 'pending' | 'done'; q: string }) {
  const router = useRouter()
  const [text, setText] = useState(q)

  const go = (next: { status?: 'pending' | 'done'; q?: string }) => {
    const s = next.status ?? status
    const query = (next.q ?? text).trim()
    const params = new URLSearchParams()
    params.set('status', s)
    if (query) params.set('q', query)
    router.push(`/admin/certificates?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-md border p-0.5">
        <button
          type="button"
          onClick={() => go({ status: 'pending' })}
          className={cn('rounded px-3 py-1.5 text-sm', status === 'pending' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
        >
          未完成
        </button>
        <button
          type="button"
          onClick={() => go({ status: 'done' })}
          className={cn('rounded px-3 py-1.5 text-sm', status === 'done' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
        >
          已完成
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          go({ q: text })
        }}
        className="flex items-center gap-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="搜尋人名…" className="h-9 w-48" />
        <Button type="submit" variant="outline" size="sm">搜尋</Button>
      </form>
    </div>
  )
}
