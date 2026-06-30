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
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('course.feedback')
  const [open, setOpen] = useState(false)
  const [recommended, setRecommended] = useState<boolean>(initialRecommended ?? true)
  const [note, setNote] = useState(initialNote ?? '')
  const [isPending, startTransition] = useTransition()

  const hasFeedback = initialRecommended !== null

  const handleSave = () => {
    startTransition(async () => {
      const res = await upsertInstructorFeedback({ enrollmentId, recommended, note })
      if (res.success) {
        toast.success(res.message ?? t('saved'))
        setOpen(false)
      } else {
        toast.error(res.message ?? t('fail'))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          {hasFeedback
            ? initialRecommended
              ? t('recommendedEdit')
              : t('notRecommendedEdit')
            : t('fill')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title', { name: studentName })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('ask', { name: studentName, book: bookLabel })}
          </p>

          <RadioGroup
            value={recommended ? 'yes' : 'no'}
            onValueChange={(v) => setRecommended(v === 'yes')}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="rec-yes" />
              <Label htmlFor="rec-yes">{t('recommend')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="rec-no" />
              <Label htmlFor="rec-no">{t('notRecommend')}</Label>
            </div>
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="fb-note" className="text-xs text-muted-foreground">
              {t('noteLabel')}
            </Label>
            <Textarea
              id="fb-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t('notePlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t('saving') : t('saveFeedback')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
