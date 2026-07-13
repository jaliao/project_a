/*
 * ----------------------------------------------
 * MaterialQuoteDialog - 教材批價對話框（金額＋匯款帳號資訊）
 * 2026-06-21 (Updated: 2026-07-13)
 * components/admin/material-quote-dialog.tsx
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { quoteMaterialOrder } from '@/app/actions/course-order'

export function MaterialQuoteDialog({
  open,
  onOpenChange,
  orderId,
  defaultAccount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  defaultAccount: string
}) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [account, setAccount] = useState(defaultAccount)
  const [errors, setErrors] = useState<{ amount?: string; account?: string }>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    startTransition(async () => {
      const result = await quoteMaterialOrder(orderId, {
        amount: parseInt(amount, 10),
        account,
      })
      if (result.success) {
        toast.success(result.message ?? '已批價並通知老師')
        onOpenChange(false)
        router.refresh()
      } else if (result.errors) {
        setErrors({
          amount: result.errors.amount?.[0],
          account: result.errors.account?.[0],
        })
      } else {
        toast.error(result.message ?? '批價失敗，請稍後再試')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>教材批價（#{orderId}）</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">金額（NT$）*</label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例：1200"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">匯款帳號資訊 *</label>
            <Textarea
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              rows={4}
              placeholder={'例：\n第一銀行淡水分行\n戶名：希望之聲文化有限公司\n銀行代碼：007\n帳號：218-10-002087'}
            />
            {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '送出中…' : '批價並通知老師'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
