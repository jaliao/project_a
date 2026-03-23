/*
 * ----------------------------------------------
 * CourseOrderForm - 課程訂購表單
 * 2026-03-23
 * components/course-order/course-order-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { courseOrderSchema, type CourseOrderFormValues } from '@/lib/schemas/course-order'
import { createCourseOrder } from '@/app/actions/course-order'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'

// 數量選項
const QUANTITY_OPTIONS = [
  { value: '1', label: '1 本 $300' },
  { value: '2', label: '2 本 $600' },
  { value: '3', label: '3 本 $900' },
  { value: '4', label: '4 本 $1200' },
  { value: '5', label: '5 本 $1500' },
  { value: '6', label: '6 本 $1800' },
  { value: '7', label: '7 本 $2100' },
  { value: '8', label: '8 本 $2400' },
  { value: 'other', label: '其他' },
]

interface CourseOrderFormProps {
  onSuccess: () => void
}

export function CourseOrderForm({ onSuccess }: CourseOrderFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CourseOrderFormValues>({
    resolver: zodResolver(courseOrderSchema),
    defaultValues: {
      buyerNameZh: '',
      buyerNameEn: '',
      teacherName: '',
      churchOrg: '',
      email: '',
      phone: '',
      studentNames: '',
      quantityNote: '',
      courseDate: '',
      taxId: '',
    },
  })

  const purchaseType = form.watch('purchaseType')
  const quantityOption = form.watch('quantityOption')
  const showStudentNames =
    purchaseType === 'selfAndProxy' || purchaseType === 'proxyOnly'
  const showQuantityNote = quantityOption === 'other'

  const onSubmit = (values: CourseOrderFormValues) => {
    startTransition(async () => {
      const result = await createCourseOrder(values as Record<string, string>)
      if (result.success) {
        toast.success(result.message ?? '訂單已送出')
        form.reset()
        onSuccess()
      } else {
        toast.error(result.message ?? '送出失敗，請稍後再試')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-5 pb-2">

            {/* ── 購買人基本資料 ─────────────────── */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">購買人資料</p>

              <FormField control={form.control} name="buyerNameZh" render={({ field }) => (
                <FormItem>
                  <FormLabel>購買人中文姓名 *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="buyerNameEn" render={({ field }) => (
                <FormItem>
                  <FormLabel>購買人英文姓名 *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="teacherName" render={({ field }) => (
                <FormItem>
                  <FormLabel>購買人的教師姓名 *</FormLabel>
                  <p className="text-xs text-muted-foreground -mt-1">請填寫您的教師姓名，而非您的姓名</p>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="churchOrg" render={({ field }) => (
                <FormItem>
                  <FormLabel>所屬教會/單位 *</FormLabel>
                  <p className="text-xs text-muted-foreground -mt-1">例：101、心欣、Kua、全福會…</p>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>購買人 Email *</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>購買人聯絡電話 *</FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ── 教材版本 ───────────────────────── */}
            <FormField control={form.control} name="materialVersion" render={({ field }) => (
              <FormItem>
                <FormLabel>教材版本 *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-1">
                    {[
                      { value: 'traditional', label: '繁體版' },
                      { value: 'simplified', label: '簡體版' },
                      { value: 'both', label: '繁體＋簡體（請在學員姓名後備註哪位是簡體教材）' },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-start gap-2">
                        <RadioGroupItem value={opt.value} id={`mv-${opt.value}`} className="mt-0.5" />
                        <label htmlFor={`mv-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── 購買性質 ───────────────────────── */}
            <FormField control={form.control} name="purchaseType" render={({ field }) => (
              <FormItem>
                <FormLabel>教師自用或協助代購 *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-1">
                    {[
                      { value: 'selfOnly', label: '只買 1 本：種子教師自用' },
                      { value: 'selfAndProxy', label: '自用之外，還要幫學員代購' },
                      { value: 'proxyOnly', label: '只幫學員代購' },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-start gap-2">
                        <RadioGroupItem value={opt.value} id={`pt-${opt.value}`} className="mt-0.5" />
                        <label htmlFor={`pt-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── 學員代購姓名（條件顯示） ─────────── */}
            {showStudentNames && (
              <FormField control={form.control} name="studentNames" render={({ field }) => (
                <FormItem>
                  <FormLabel>幫學員代購（務必填寫學員完整中文姓名）*</FormLabel>
                  <p className="text-xs text-muted-foreground -mt-1">例：學員1-李大明；學員2-吳小魚…</p>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* ── 購買數量 ───────────────────────── */}
            <FormField control={form.control} name="quantityOption" render={({ field }) => (
              <FormItem>
                <FormLabel>總購買數量 *（運費另計：本島$70/1處；離島$100/1處）</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-1">
                    {QUANTITY_OPTIONS.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`qty-${opt.value}`} />
                        <label htmlFor={`qty-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── 自填數量（條件顯示） ──────────────── */}
            {showQuantityNote && (
              <FormField control={form.control} name="quantityNote" render={({ field }) => (
                <FormItem>
                  <FormLabel>請填寫數量 *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* ── 預計開課日期 ──────────────────────── */}
            <FormField control={form.control} name="courseDate" render={({ field }) => (
              <FormItem>
                <FormLabel>預計開課日期 *</FormLabel>
                <p className="text-xs text-muted-foreground -mt-1">暫無開課計畫請填「無」</p>
                <FormControl>
                  <Input placeholder="例：2026-05-01 或 無" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── 統一編號（選填） ──────────────────── */}
            <FormField control={form.control} name="taxId" render={({ field }) => (
              <FormItem>
                <FormLabel>統一編號（若有報帳需求）</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── 取貨方式 ──────────────────────────── */}
            <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
              <FormItem>
                <FormLabel>取貨方式 *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-1">
                    {[
                      { value: 'sevenEleven', label: '7-11 取貨' },
                      { value: 'familyMart', label: '全家取貨' },
                      { value: 'delivery', label: '郵寄、宅配' },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`dm-${opt.value}`} />
                        <label htmlFor={`dm-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

          </div>
        </ScrollArea>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? '送出中…' : '送出訂單'}
        </Button>
      </form>
    </Form>
  )
}
