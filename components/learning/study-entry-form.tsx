/*
 * ----------------------------------------------
 * StudyEntryForm - 分段查經筆記表單（新增／編輯共用）
 * 2026-08-28
 * components/learning/study-entry-form.tsx
 *
 * create 模式為常駐表單（該經文項目尚無筆記時直接顯示），只有「儲存」；
 * 送出成功後靠頁面 revalidate 重繪為檢視卡，不需 onDone/onCancel。
 * edit 模式由檢視卡切入，保留「儲存＋取消」並回呼收合。
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { studyEntryContentSchema } from '@/lib/schemas/learning-study'
import { createStudyEntry, updateStudyEntry } from '@/app/actions/learning-study'

type FormValues = z.infer<typeof studyEntryContentSchema>

type CreateProps = {
  mode: 'create'
  courseCatalogId: number
  lessonKey: string
  scriptureKey: string
}

type EditProps = {
  mode: 'edit'
  entryId: number
  initial: FormValues
  onDone: () => void
  onCancel: () => void
}

export function StudyEntryForm(props: CreateProps | EditProps) {
  const t = useTranslations('learning')
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(studyEntryContentSchema),
    defaultValues:
      props.mode === 'edit'
        ? props.initial
        : { mainTitle: '', subTitle: '', wordReceived: '', application: '' },
  })

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const res =
        props.mode === 'create'
          ? await createStudyEntry({
              ...values,
              courseCatalogId: props.courseCatalogId,
              lessonKey: props.lessonKey,
              scriptureKey: props.scriptureKey,
            })
          : await updateStudyEntry(props.entryId, values)

      if (res.success) {
        toast.success(res.message ?? '')
        if (props.mode === 'edit') props.onDone()
      } else if (res.errors) {
        toast.error(t('genericError'))
      } else {
        toast.error(res.message ?? t('genericError'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-muted/30 p-4">
      <div>
        <Label className="mb-1 block text-sm font-medium">{t('fieldMainTitle')} *</Label>
        <Input
          {...register('mainTitle')}
          placeholder={t('mainTitlePlaceholder')}
          disabled={isPending}
        />
        <FieldError message={errors.mainTitle?.message} className="mt-1" />
      </div>

      <div>
        <Label className="mb-1 block text-sm font-medium">{t('fieldSubTitle')}</Label>
        <Textarea {...register('subTitle')} rows={2} disabled={isPending} />
        <FieldError message={errors.subTitle?.message} className="mt-1" />
      </div>

      <div>
        <Label className="mb-1 block text-sm font-medium">{t('fieldWordReceived')}</Label>
        <Textarea {...register('wordReceived')} rows={4} disabled={isPending} />
        <FieldError message={errors.wordReceived?.message} className="mt-1" />
      </div>

      <div>
        <Label className="mb-1 block text-sm font-medium">{t('fieldApplication')}</Label>
        <Textarea {...register('application')} rows={4} disabled={isPending} />
        <FieldError message={errors.application?.message} className="mt-1" />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {t('save')}
        </Button>
        {props.mode === 'edit' && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={props.onCancel}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
