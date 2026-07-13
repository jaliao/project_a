/*
 * ----------------------------------------------
 * 匯款帳號資訊設定表單（教材繳費批價用）
 * 2026-06-21 (Updated: 2026-07-13)
 * components/admin/remittance-account-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
        setMessage(result.message ?? '匯款帳號資訊已儲存')
      } else {
        setError(result.errors?.account?.[0] ?? result.message ?? '儲存失敗')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-1">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="w-80"
          placeholder={'例：\n第一銀行淡水分行\n戶名：希望之聲文化有限公司\n銀行代碼：007\n帳號：218-10-002087'}
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
