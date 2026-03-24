/*
 * ----------------------------------------------
 * CancelCourseDialog - 取消課程確認對話視窗
 * 2026-03-24
 * components/course-session/cancel-course-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cancelCourseSession } from '@/app/actions/course-invite'

const PRESET_REASONS = [
  { value: '人數不足', label: '人數不足' },
  { value: '時間因素', label: '時間因素' },
  { value: '__other__', label: '其他' },
]

type Props = {
  inviteId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CancelCourseDialog({ inviteId, open, onOpenChange }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  const isOther = selected === '__other__'
  const finalReason = isOther ? customReason.trim() : selected

  function handleClose() {
    setSelected('')
    setCustomReason('')
    onOpenChange(false)
  }

  async function handleConfirm() {
    if (!finalReason) {
      toast.error('請填寫取消原因')
      return
    }
    setLoading(true)
    const result = await cancelCourseSession(inviteId, finalReason)
    setLoading(false)
    if (result.success) {
      toast.success('課程已取消')
      handleClose()
      router.refresh()
    } else {
      toast.error(result.message ?? '取消失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確認取消課程</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>取消原因</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇原因" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <div className="space-y-1.5">
              <Label>請說明原因</Label>
              <Textarea
                placeholder="請輸入取消原因..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? '處理中...' : '確認取消課程'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
