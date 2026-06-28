/*
 * ----------------------------------------------
 * EditCourseInfoDialog - 招生階段編輯課程資訊（Client Component）
 * 2026-06-28
 * components/course-session/edit-course-info-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateCourseInfo } from '@/app/actions/course-session'

interface Props {
  inviteId: number
  approvedCount: number
  initial: {
    title: string
    maxCount: number
    expiredAt: Date | null
    courseDate: string | null // YYYY/MM/DD
    notes: string | null
  }
}

// Date → yyyy-mm-dd（本地時區，供 <input type="date"> 使用）
function toDateInput(date: Date | null): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function EditCourseInfoDialog({ inviteId, approvedCount, initial }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(initial.title)
  const [maxCount, setMaxCount] = useState(String(initial.maxCount))
  const [expiredAt, setExpiredAt] = useState(toDateInput(initial.expiredAt))
  const [courseDate, setCourseDate] = useState((initial.courseDate ?? '').replace(/\//g, '-'))
  const [notes, setNotes] = useState(initial.notes ?? '')

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('課程名稱為必填')
      return
    }
    if (!expiredAt || !courseDate) {
      toast.error('請選擇截止日與開課日')
      return
    }
    startTransition(async () => {
      const res = await updateCourseInfo(inviteId, {
        title: title.trim(),
        maxCount: Number(maxCount),
        expiredAt: new Date(expiredAt),
        courseDate: new Date(courseDate),
        notes,
      })
      if (res.success) {
        toast.success(res.message ?? '已更新課程資訊')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.message ?? res.errors?.maxCount?.[0] ?? '更新失敗，請稍後再試')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          編輯課程資訊
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>編輯課程資訊</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">課程名稱</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">預計人數</label>
            <Input
              type="number"
              min={1}
              max={7}
              value={maxCount}
              onChange={(e) => setMaxCount(e.target.value)}
              disabled={isPending}
              className="w-28"
            />
            <p className="text-xs text-muted-foreground">
              每班最多 7 人{approvedCount > 0 && `，且不可低於已核准學員數（${approvedCount}）`}
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">邀請截止日</label>
              <Input type="date" value={expiredAt} onChange={(e) => setExpiredAt(e.target.value)} disabled={isPending} />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">預計開課日</label>
              <Input type="date" value={courseDate} onChange={(e) => setCourseDate(e.target.value)} disabled={isPending} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">內部備註</label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isPending} placeholder="選填" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? '儲存中…' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
