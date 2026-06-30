/*
 * ----------------------------------------------
 * Step2BasicInfo - 精靈步驟 2：基本資料填寫
 * 2026-03-30
 * components/course-session/create-course-wizard/step-2-basic-info.tsx
 * ----------------------------------------------
 */

'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { courseSessionSchema, type CourseSessionFormValues } from '@/lib/schemas/course-session'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'

const isDev = process.env.NODE_ENV === 'development'

export type Step2FormValues = CourseSessionFormValues

interface Step2BasicInfoProps {
  courseCatalogId: number
  courseCatalogLabel: string
  instructorName: string
  defaultValues?: Partial<Step2FormValues>
  onNext: (values: Step2FormValues) => void
  onBack: () => void
}

export function Step2BasicInfo({
  courseCatalogId,
  courseCatalogLabel,
  instructorName,
  defaultValues,
  onNext,
  onBack,
}: Step2BasicInfoProps) {
  const t = useTranslations('course.wizard')
  const titleDirtyRef = useRef(false)

  const buildDefaultTitle = () =>
    instructorName ? `${instructorName} 的 ${courseCatalogLabel}` : courseCatalogLabel

  const form = useForm<Step2FormValues>({
    resolver: zodResolver(courseSessionSchema),
    defaultValues: defaultValues ?? (
      isDev
        ? {
            courseCatalogId,
            title: buildDefaultTitle(),
            maxCount: '5',
            expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            courseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            notes: '',
            isPublicMatch: false,
            matchNote: '',
          }
        : {
            courseCatalogId,
            title: buildDefaultTitle(),
            maxCount: '',
            notes: '',
            isPublicMatch: false,
            matchNote: '',
          }
    ),
  })

  const onSubmit = (values: Step2FormValues) => {
    onNext({ ...values, courseCatalogId })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* 課程名稱 */}
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('courseName')} *</FormLabel>
            <FormControl>
              <Input
                {...field}
                onChange={(e) => {
                  titleDirtyRef.current = true
                  field.onChange(e)
                }}
                placeholder={`例：${buildDefaultTitle()}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* 預計上課人數 */}
        <FormField control={form.control} name="maxCount" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('maxCount')} *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={7}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">{t('maxHint')}</p>
            <FormMessage />
          </FormItem>
        )} />

        {/* 預計開課日期 */}
        <FormField control={form.control} name="courseDate" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('startDate')} *</FormLabel>
            <FormControl>
              <DatePicker value={field.value} onChange={field.onChange} placeholder={t('selectStartDate')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* 邀請截止日期 */}
        <FormField control={form.control} name="expiredAt" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('deadline')} *</FormLabel>
            <FormControl>
              <DatePicker value={field.value} onChange={field.onChange} placeholder={t('selectDeadline')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* 備註（選填） */}
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('notes')}</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder={t('notesOptional')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* 公開媒合（預設關閉）*/}
        <FormField control={form.control} name="isPublicMatch" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>{t('publicMatch')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('publicMatchHint')}</p>
            </div>
            <FormControl>
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />

        {/* 公開招募備註（僅公開媒合開啟時顯示）*/}
        {form.watch('isPublicMatch') && (
          <FormField control={form.control} name="matchNote" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('matchNote')}</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder={t('matchNoteHint')} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            {t('prev')}
          </Button>
          <Button type="submit" className="flex-1">
            {t('next')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
