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
import { Button } from '@/components/ui/button'
import { createCourseSession } from '@/app/actions/course-session'
import type { Step2FormValues } from './step-2-basic-info'

interface Step3PreviewProps {
  formValues: Step2FormValues
  onSuccess: (inviteId: number) => void
  onBack: () => void
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function Step3Preview({ formValues, onSuccess, onBack }: Step3PreviewProps) {
  const [isPending, startTransition] = useTransition()

  const rows = [
    { label: '課程名稱', value: formValues.title },
    { label: '預計開課日期', value: formValues.courseDate ? formatDate(formValues.courseDate) : '—' },
    { label: '邀請截止日期', value: formValues.expiredAt ? formatDate(formValues.expiredAt) : '—' },
    { label: '預計人數', value: `${formValues.maxCount} 人` },
    ...(formValues.notes ? [{ label: '備註', value: formValues.notes }] : []),
  ]

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await createCourseSession(formValues as Record<string, unknown>)
      if (result.success && result.data) {
        toast.success('授課已建立！')
        onSuccess(result.data.inviteId)
      } else {
        toast.error(result.message ?? '建立失敗，請稍後再試')
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">請確認以下開課資訊</p>

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
          上一步
        </Button>
        <Button className="flex-1" onClick={handleConfirm} disabled={isPending}>
          {isPending ? '建立中…' : '確認開課'}
        </Button>
      </div>
    </div>
  )
}
