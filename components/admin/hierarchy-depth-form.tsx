/*
 * ----------------------------------------------
 * 學習階層深度設定表單
 * 2026-04-02
 * components/admin/hierarchy-depth-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateHierarchyDepth } from '@/app/actions/admin-settings'

export function HierarchyDepthForm({ currentDepth }: { currentDepth: number }) {
  const [value, setValue] = useState(String(currentDepth))
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const depth = parseInt(value, 10)
    setMessage(null)
    setError(null)

    startTransition(async () => {
      const result = await updateHierarchyDepth(depth)
      if (result.success) {
        setMessage(result.message ?? '設定已儲存')
      } else {
        setError(result.errors?.depth?.[0] ?? result.message ?? '儲存失敗')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-1">
        <Input
          type="number"
          min={1}
          max={10}
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
