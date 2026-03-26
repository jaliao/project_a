/*
 * ----------------------------------------------
 * EnrollmentApplicationDialog - 學員申請參加 + 書籍選購
 * 2026-03-24
 * components/course-session/enrollment-application-dialog.tsx
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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { applyToCourse } from '@/app/actions/course-invite'

type MaterialChoice = 'none' | 'traditional' | 'simplified'

const MATERIAL_OPTIONS: { value: MaterialChoice; label: string; desc: string }[] = [
  { value: 'none', label: '無須購買', desc: '已有教材或不需要購買' },
  { value: 'traditional', label: '繁體教材', desc: '購買繁體中文版教材' },
  { value: 'simplified', label: '簡體教材', desc: '購買簡體中文版教材' },
]

type Props = {
  inviteId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  courseTitle: string
  courseDate?: string | null
  instructorName: string
}

export function EnrollmentApplicationDialog({ inviteId, open, onOpenChange, courseTitle, courseDate, instructorName }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<MaterialChoice | ''>('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setSelected('')
    onOpenChange(false)
  }

  async function handleConfirm() {
    if (!selected) {
      toast.error('請選擇書籍選項')
      return
    }
    setLoading(true)
    const result = await applyToCourse(inviteId, selected)
    setLoading(false)
    if (result.success) {
      toast.success('申請已送出，等待講師審核')
      handleClose()
      router.refresh()
    } else {
      toast.error(result.message ?? '申請失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>選擇書籍</DialogTitle>
        </DialogHeader>

        {/* 課程資訊確認區塊 */}
        <div className="rounded-lg bg-muted/50 border p-3 space-y-1 text-sm">
          <p className="font-medium">{courseTitle}</p>
          <p className="text-muted-foreground">講師：{instructorName}</p>
          {courseDate && (
            <p className="text-muted-foreground">預計開課：{courseDate}</p>
          )}
        </div>

        <div className="space-y-3 py-2">
          {MATERIAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                'w-full rounded-lg border p-4 text-left transition-colors',
                selected === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
            >
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !selected}>
            {loading ? '送出中...' : '確認申請'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
