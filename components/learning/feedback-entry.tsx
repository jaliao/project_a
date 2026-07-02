/*
 * ----------------------------------------------
 * 學員課程狀態 + 學習歷程回饋（自助回報 / 一鍵回報未結業）
 * 2026-07-02
 * components/learning/feedback-entry.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FieldError } from '@/components/ui/field-error'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  learningFeedbackSchema,
  FEEDBACK_CATEGORIES,
  type LearningFeedbackFormValues,
  type LearningFeedbackFormInput,
  type FeedbackCategoryValue,
} from '@/lib/schemas/learning-feedback'
import { submitLearningFeedback } from '@/app/actions/learning-feedback'
import type { MyFeedbackItem } from '@/lib/data/learning-feedback'

type CourseOpt = { id: number; label: string }
export type LearningRecord = {
  enrollmentId: number
  courseCatalogId: number
  title: string
  teacherName: string
  status: 'graduated' | 'not_graduated' | 'in_progress'
}

function FeedbackStatusBadge({ status, label }: { status: MyFeedbackItem['status']; label: string }) {
  if (status === 'approved')
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{label}</Badge>
  if (status === 'rejected') return <Badge variant="secondary">{label}</Badge>
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{label}</Badge>
}

function RecordStatusBadge({ status, label }: { status: LearningRecord['status']; label: string }) {
  if (status === 'graduated')
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{label}</Badge>
  if (status === 'not_graduated') return <Badge variant="secondary">{label}</Badge>
  return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{label}</Badge>
}

export function LearningRecordsPanel({
  records,
  courses,
  myFeedbacks,
}: {
  records: LearningRecord[]
  courses: CourseOpt[]
  myFeedbacks: MyFeedbackItem[]
}) {
  const t = useTranslations('learningFeedback')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LearningFeedbackFormInput, unknown, LearningFeedbackFormValues>({
    resolver: zodResolver(learningFeedbackSchema),
    defaultValues: { category: 'missing_record', teacherName: '', note: '' },
  })

  const openBlank = () => {
    reset({ category: 'missing_record', teacherName: '', note: '' })
    setOpen(true)
  }
  // 一鍵回報：預帶課程與老師，類別預設「應結業卻未結業」
  const openReport = (rec: LearningRecord, category: FeedbackCategoryValue = 'not_graduated') => {
    reset({ category, teacherName: rec.teacherName, courseCatalogId: rec.courseCatalogId, note: '' })
    setOpen(true)
  }

  const onSubmit = handleSubmit((values) => {
    start(async () => {
      const res = await submitLearningFeedback(values)
      if (res.success) {
        toast.success(res.message ?? t('submitted'))
        reset({ category: 'missing_record', teacherName: '', note: '' })
        setOpen(false)
        router.refresh()
      } else if (res.errors) {
        toast.error(t('checkForm'))
      } else {
        toast.error(res.message ?? t('submitFailed'))
      }
    })
  })

  return (
    <section className="space-y-3">
      {/* 我的課程狀態（僅本人可見） */}
      {records.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">{t('colCourse')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colTeacher')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.enrollmentId}>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.teacherName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RecordStatusBadge status={r.status} label={t(`recordStatus_${r.status}`)} />
                      {r.status === 'not_graduated' && (
                        <button
                          type="button"
                          onClick={() => openReport(r)}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {t('reportButton')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 遺失學習歷程入口 */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t('prompt')}</p>
        <Button size="sm" variant="outline" className="shrink-0" onClick={openBlank}>
          {t('entryButton')}
        </Button>
      </div>

      {/* 我送出的回饋 */}
      {myFeedbacks.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">{t('colCategory')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colCourse')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colTeacher')}</th>
                <th className="px-4 py-2.5 font-medium">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {myFeedbacks.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3">{t(`category_${f.category}`)}</td>
                  <td className="px-4 py-3">{f.courseCatalogLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.teacherName}</td>
                  <td className="px-4 py-3">
                    <FeedbackStatusBadge status={f.status} label={t(`status_${f.status}`)} />
                    {f.status === 'rejected' && f.adminNote ? (
                      <span className="mt-1 block text-xs text-muted-foreground">{f.adminNote}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 回饋表單 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('formTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label>{t('category')}</Label>
              <div className="space-y-1.5">
                {FEEDBACK_CATEGORIES.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input type="radio" value={c} {...register('category')} />
                    {t(`category_${c}`)}
                  </label>
                ))}
              </div>
              <FieldError message={errors.category?.message} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="lf-teacher">{t('teacherName')}</Label>
              <Input
                id="lf-teacher"
                disabled={pending}
                placeholder={t('teacherPlaceholder')}
                {...register('teacherName')}
              />
              <FieldError message={errors.teacherName?.message} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="lf-course">{t('course')}</Label>
              <select
                id="lf-course"
                disabled={pending}
                defaultValue=""
                className="h-9 rounded-md border px-3 py-1 text-sm bg-background"
                {...register('courseCatalogId')}
              >
                <option value="" disabled>
                  {t('coursePlaceholder')}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.courseCatalogId?.message} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="lf-note">{t('note')}</Label>
              <Textarea id="lf-note" rows={2} disabled={pending} {...register('note')} />
              <FieldError message={errors.note?.message} />
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? t('submitting') : t('submit')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
