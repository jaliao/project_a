/*
 * ----------------------------------------------
 * CourseSessionForm - 新增授課表單
 * 2026-03-23 (Updated: 2026-03-26)
 * components/course-session/course-session-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useRef, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { courseSessionSchema, type CourseSessionFormValues } from '@/lib/schemas/course-session'
import { createCourseSession } from '@/app/actions/course-session'
import type { CourseCatalogEntry } from '@/lib/data/course-catalog'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DatePicker } from '@/components/ui/date-picker'

const isDev = process.env.NODE_ENV === 'development'

interface CourseSessionFormProps {
  activeCourses: CourseCatalogEntry[]
  instructorName?: string
  onSuccess: (inviteId: number) => void
}

export function CourseSessionForm({ activeCourses, instructorName = '', onSuccess }: CourseSessionFormProps) {
  const [isPending, startTransition] = useTransition()
  // 追蹤使用者是否已手動修改課程名稱
  const titleDirtyRef = useRef(false)

  // 產生預設課程名稱
  const buildDefaultTitle = (catalogId: number) => {
    const label = activeCourses.find((c) => c.id === catalogId)?.label ?? ''
    return instructorName ? `${instructorName} 的 ${label}` : label
  }

  const firstCourse = activeCourses[0]
  const form = useForm<CourseSessionFormValues>({
    resolver: zodResolver(courseSessionSchema),
    defaultValues: isDev && firstCourse
      ? {
          courseCatalogId: firstCourse.id,
          title: buildDefaultTitle(firstCourse.id),
          maxCount: '5',
          expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          courseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          notes: '',
        }
      : {
          courseCatalogId: 0,
          title: '',
          maxCount: '',
          notes: '',
        },
  })

  // 課程選擇變更時自動更新課程名稱（若尚未手動修改）
  const handleCatalogChange = (value: string, fieldOnChange: (v: number) => void) => {
    const id = parseInt(value, 10)
    fieldOnChange(id)
    if (!titleDirtyRef.current) {
      form.setValue('title', buildDefaultTitle(id))
    }
  }

  const onSubmit = (values: CourseSessionFormValues) => {
    startTransition(async () => {
      const result = await createCourseSession(values as Record<string, unknown>)
      if (result.success && result.data) {
        toast.success(result.message ?? '授課已建立！')
        titleDirtyRef.current = false
        form.reset()
        onSuccess(result.data.inviteId)
      } else {
        toast.error(result.message ?? '建立失敗，請稍後再試')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 pb-2">

            {/* 課程選擇 */}
            <FormField control={form.control} name="courseCatalogId" render={({ field }) => (
              <FormItem>
                <FormLabel>開設課程 *</FormLabel>
                <Select
                  onValueChange={(v) => handleCatalogChange(v, field.onChange)}
                  value={field.value ? String(field.value) : ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇課程" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeCourses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* 課程名稱 */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>課程名稱 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      titleDirtyRef.current = true
                      field.onChange(e)
                    }}
                    placeholder={`例：${instructorName ? `${instructorName} 的 ` : ''}啟動靈人`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 預計人數 */}
            <FormField control={form.control} name="maxCount" render={({ field }) => (
              <FormItem>
                <FormLabel>預計上課人數 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 預計開課日期 */}
            <FormField control={form.control} name="courseDate" render={({ field }) => (
              <FormItem>
                <FormLabel>預計開課日期 *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="選擇開課日期"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 邀請截止日期 */}
            <FormField control={form.control} name="expiredAt" render={({ field }) => (
              <FormItem>
                <FormLabel>邀請截止日期 *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="選擇截止日期"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 備註（選填） */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>備註</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="選填" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

          </div>
        </ScrollArea>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? '建立中…' : '建立授課'}
        </Button>
      </form>
    </Form>
  )
}
