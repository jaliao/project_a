/*
 * ----------------------------------------------
 * GenderPromptDialog - 首頁性別補填提示對話框
 * 2026-08-03
 * components/dashboard/gender-prompt-dialog.tsx
 *
 * 已完成首次填寫（realName/phone 皆有值）但 gender 仍為
 * unspecified 的會員，造訪自己首頁時彈出，可關閉略過，
 * 只要 gender 仍未填，下次造訪首頁會再次彈出（cr-spec-260803-002）
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { updateGender } from '@/app/actions/profile'

export function GenderPromptDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<'male' | 'female' | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    const result = await updateGender(selected)
    setLoading(false)
    if (result.success) {
      toast.success(result.message ?? '性別已更新')
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.message ?? '更新失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>請填寫您的性別</DialogTitle>
          <DialogDescription>這項資料尚未填寫，請協助補齊，以利後續服務與統計。</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelected(g)}
              className={cn(
                'flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                selected === g
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
              disabled={loading}
            >
              {g === 'male' ? '男' : '女'}
            </button>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={loading}>
              稍後再說
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!selected || loading}>
            {loading ? '送出中…' : '送出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
