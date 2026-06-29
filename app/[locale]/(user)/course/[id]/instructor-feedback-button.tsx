/*
 * ----------------------------------------------
 * InstructorFeedbackButton - 講師資格回饋（課程建立者對已結業學員填寫）
 * 2026-06-20
 * app/(user)/course/[id]/instructor-feedback-button.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { upsertInstructorFeedback } from '@/app/actions/course-invite'

interface InstructorFeedbackButtonProps {
  enrollmentId: number
  studentName: string
  bookLabel: string // 該課程的書名（用於提示文字）
  initialRecommended: boolean | null
  initialNote: string | null
}

export function InstructorFeedbackButton({
  enrollmentId,
  studentName,
  bookLabel,
  initialRecommended,
  initialNote,
}: InstructorFeedbackButtonProps) {
  const [open, setOpen] = useState(false)
  const [recommended, setRecommended] = useState<boolean>(initialRecommended ?? true)
  const [note, setNote] = useState(initialNote ?? '')
  const [isPending, startTransition] = useTransition()

  const hasFeedback = initialRecommended !== null

  const handleSave = () => {
    startTransition(async () => {
      const res = await upsertInstructorFeedback({ enrollmentId, recommended, note })
      if (res.success) {
        toast.success(res.message ?? '已儲存')
        setOpen(false)
      } else {
        toast.error(res.message ?? '操作失敗，請稍後再試')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          {hasFeedback
            ? initialRecommended
              ? '已推薦・編輯'
              : '不推薦・編輯'
            : '填寫講師資格回饋'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>講師資格回饋 — {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            是否推薦 {studentName} 成為「{bookLabel}」講師？
          </p>

          <RadioGroup
            value={recommended ? 'yes' : 'no'}
            onValueChange={(v) => setRecommended(v === 'yes')}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="rec-yes" />
              <Label htmlFor="rec-yes">推薦</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="rec-no" />
              <Label htmlFor="rec-no">不推薦</Label>
            </div>
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="fb-note" className="text-xs text-muted-foreground">
              備註（選填，最多 500 字）
            </Label>
            <Textarea
              id="fb-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="補充推薦理由或觀察…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? '儲存中…' : '儲存回饋'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
