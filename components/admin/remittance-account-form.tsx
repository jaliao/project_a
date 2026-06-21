/*
 * ----------------------------------------------
 * 匯款帳號設定表單（教材繳費批價用）
 * 2026-06-21
 * components/admin/remittance-account-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateRemittanceAccount } from '@/app/actions/admin-settings'

export function RemittanceAccountForm({ currentAccount }: { currentAccount: string }) {
  const [value, setValue] = useState(currentAccount)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    startTransition(async () => {
      const result = await updateRemittanceAccount(value)
      if (result.success) {
        setMessage(result.message ?? '匯款帳號已儲存')
      } else {
        setError(result.errors?.account?.[0] ?? result.message ?? '儲存失敗')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-56"
          placeholder="例：08-2345-6789"
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
