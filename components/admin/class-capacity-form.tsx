/*
 * ----------------------------------------------
 * 班級人數上限設定表單
 * 2026-07-01
 * components/admin/class-capacity-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateClassMaxCapacity } from '@/app/actions/admin-settings'

export function ClassCapacityForm({ current }: { current: number }) {
  const [value, setValue] = useState(String(current))
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const capacity = parseInt(value, 10)
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await updateClassMaxCapacity(capacity)
      if (result.success) {
        setMessage(result.message ?? '設定已儲存')
      } else {
        setError(result.errors?.capacity?.[0] ?? result.message ?? '儲存失敗')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-1">
        <Input
          type="number"
          min={1}
          max={99}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {message && <p className="text-xs text-green-600">{message}</p>}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '儲存中…' : '儲存'}
      </Button>
    </form>
  )
}
