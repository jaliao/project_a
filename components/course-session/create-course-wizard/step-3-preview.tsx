/*
 * ----------------------------------------------
 * Step3Preview - 精靈步驟 3：預覽確認
 * 2026-03-30
 * components/course-session/create-course-wizard/step-3-preview.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { createCourseSession } from '@/app/actions/course-session'
import type { Step2FormValues } from './step-2-basic-info'

interface Step3PreviewProps {
  formValues: Step2FormValues
  // 管理者代講師建立時帶入目標老師 id；一般建立為 undefined
  targetTeacherId?: string
  onSuccess: (inviteId: number) => void
  onBack: () => void
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function Step3Preview({ formValues, targetTeacherId, onSuccess, onBack }: Step3PreviewProps) {
  const t = useTranslations('course.wizard')
  const [isPending, startTransition] = useTransition()

  const rows = [
    { label: t('courseName'), value: formValues.title },
    { label: t('fieldStartDate'), value: formValues.courseDate ? formatDate(formValues.courseDate) : '—' },
    { label: t('fieldDeadline'), value: formValues.expiredAt ? formatDate(formValues.expiredAt) : '—' },
    { label: t('fieldMaxCount'), value: t('peopleCount', { count: formValues.maxCount }) },
    ...(formValues.notes ? [{ label: t('fieldNotes'), value: formValues.notes }] : []),
  ]

  const handleConfirm = () => {
    startTransition(async () => {
      const payload = targetTeacherId ? { ...formValues, targetTeacherId } : formValues
      const result = await createCourseSession(payload as Record<string, unknown>)
      if (result.success && result.data) {
        toast.success(t('created'))
        onSuccess(result.data.inviteId)
      } else {
        toast.error(result.message ?? t('createFail'))
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('previewHint')}</p>

      <div className="rounded-lg border divide-y">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-start gap-3 px-4 py-3">
            <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={isPending}>
          {t('prev')}
        </Button>
        <Button className="flex-1" onClick={handleConfirm} disabled={isPending}>
          {isPending ? t('creating') : t('confirmCreate')}
        </Button>
      </div>
    </div>
  )
}
