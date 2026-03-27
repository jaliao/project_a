/*
 * ----------------------------------------------
 * CreateInviteForm - 建立邀請表單
 * 2026-03-23 (Updated: 2026-03-23)
 * components/course-invite/create-invite-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { IconShare, IconCheck } from '@tabler/icons-react'
import { createInvite } from '@/app/actions/course-invite'
import { getActiveCourses } from '@/config/course-catalog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const activeCourses = getActiveCourses()

// 前端表單 schema（輸入為字串）
const formSchema = z.object({
  courseLevel: z.string().min(1, '請選擇課程'),
  maxCount: z.string().min(1, '預計人數為必填'),
  courseOrderId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Order {
  id: number
  buyerNameZh: string
  courseDate: string
}

interface CreateInviteFormProps {
  orders: Order[]
  onSuccess: () => void
}

export function CreateInviteForm({ orders, onSuccess }: CreateInviteFormProps) {
  const [isPending, startTransition] = useTransition()
  const [courseLink, setCourseLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { courseLevel: '', maxCount: '', courseOrderId: '' },
  })

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createInvite(values as Record<string, string>)
      if (result.success && result.data) {
        const link = `${window.location.origin}/course/${result.data.id}`
        setCourseLink(link)
      } else {
        toast.error(result.message ?? '建立失敗，請稍後再試')
      }
    })
  }

  const handleShare = async () => {
    if (!courseLink) return
    if (navigator.share) {
      try {
        await navigator.share({ title: '課程連結', url: courseLink })
      } catch {
        // 使用者取消分享
      }
    } else {
      navigator.clipboard.writeText(courseLink).then(() => {
        setCopied(true)
        toast.success('已複製課程連結！')
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  // 建立成功後顯示課程連結複製 View
  if (courseLink) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">邀請建立成功！分享以下連結給學員申請：</p>
        <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
          <span className="flex-1 truncate text-sm font-mono">{courseLink}</span>
          <Button size="sm" variant="ghost" onClick={handleShare} className="shrink-0">
            {copied ? <IconCheck className="h-4 w-4 text-green-600" /> : <IconShare className="h-4 w-4" />}
            {copied ? '已複製！' : '分享'}
          </Button>
        </div>
        <Button className="w-full" variant="outline" onClick={onSuccess}>
          完成
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 課程選擇 */}
        <FormField control={form.control} name="courseLevel" render={({ field }) => (
          <FormItem>
            <FormLabel>課程 *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇課程" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {activeCourses.map((c) => (
                  <SelectItem key={c.level} value={c.level}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="maxCount" render={({ field }) => (
          <FormItem>
            <FormLabel>預計人數 *</FormLabel>
            <FormControl><Input type="number" min={1} placeholder="例：12" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="courseOrderId" render={({ field }) => (
          <FormItem>
            <FormLabel>關聯訂單（選填）</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="不關聯訂單" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    #{o.id} {o.buyerNameZh}（{o.courseDate}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? '建立中…' : '建立邀請'}
        </Button>
      </form>
    </Form>
  )
}
