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
import { useTranslations } from 'next-intl'
import { applyToCourse } from '@/app/actions/course-invite'

type MaterialChoice = 'none' | 'traditional' | 'simplified'

type Props = {
  inviteId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  courseTitle: string
  courseDate?: string | null
  instructorName: string
}

export function EnrollmentApplicationDialog({ inviteId, open, onOpenChange, courseTitle, courseDate, instructorName }: Props) {
  const t = useTranslations()
  const MATERIAL_OPTIONS: { value: MaterialChoice; label: string; desc: string }[] = [
    { value: 'none', label: t('course.material.none'), desc: t('course.enroll.noneDesc') },
    { value: 'traditional', label: t('course.material.traditional'), desc: t('course.enroll.tradDesc') },
    { value: 'simplified', label: t('course.material.simplified'), desc: t('course.enroll.simpDesc') },
  ]
  const router = useRouter()
  const [selected, setSelected] = useState<MaterialChoice | ''>('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setSelected('')
    onOpenChange(false)
  }

  async function handleConfirm() {
    if (!selected) {
      toast.error(t('course.enroll.selectBook'))
      return
    }
    setLoading(true)
    const result = await applyToCourse(inviteId, selected)
    setLoading(false)
    if (result.success) {
      toast.success(t('course.enroll.success'))
      handleClose()
      router.refresh()
    } else {
      toast.error(result.message ?? t('course.enroll.fail'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('course.enroll.chooseBook')}</DialogTitle>
        </DialogHeader>

        {/* 課程資訊確認區塊 */}
        <div className="rounded-lg bg-muted/50 border p-3 space-y-1 text-sm">
          <p className="font-medium">{courseTitle}</p>
          <p className="text-muted-foreground">{t('course.enroll.teacherLabel')}{instructorName}</p>
          {courseDate && (
            <p className="text-muted-foreground">{t('course.enroll.expectedStart')}{courseDate}</p>
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
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !selected}>
            {loading ? t('course.enroll.submitting') : t('course.enroll.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
