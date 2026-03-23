/*
 * ----------------------------------------------
 * CourseSessionForm - 新增開課合併表單
 * 2026-03-23
 * components/course-session/course-session-form.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { courseSessionSchema, type CourseSessionFormValues } from '@/lib/schemas/course-session'
import { createCourseSession } from '@/app/actions/course-session'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DatePicker } from '@/components/ui/date-picker'

const isDev = process.env.NODE_ENV === 'development'

// 開發環境測試資料
const DEV_DEFAULTS: Partial<CourseSessionFormValues> = {
  courseLevel: 'level1',
  maxCount: '5',
  expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天後
  buyerNameZh: '王大明',
  buyerNameEn: 'David Wang',
  teacherName: '陳老師',
  churchOrg: '101',
  email: 'dev@test.com',
  phone: '0912345678',
  materialVersion: 'traditional',
  purchaseType: 'selfAndProxy',
  studentNames: '李小美；張小華',
  quantityOption: '3',
  courseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 天後
  taxId: '',
  deliveryMethod: 'sevenEleven',
}

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

interface CourseSessionFormProps {
  onSuccess: (token: string) => void
}

export function CourseSessionForm({ onSuccess }: CourseSessionFormProps) {
  const [isPending, startTransition] = useTransition()
  const activeCourses = getActiveCourses()

  const form = useForm<CourseSessionFormValues>({
    resolver: zodResolver(courseSessionSchema),
    defaultValues: isDev
      ? (DEV_DEFAULTS as CourseSessionFormValues)
      : {
          buyerNameZh: '',
          buyerNameEn: '',
          teacherName: '',
          churchOrg: '',
          email: '',
          phone: '',
          studentNames: '',
          quantityNote: '',
          taxId: '',
        },
  })

  const purchaseType = form.watch('purchaseType')
  const quantityOption = form.watch('quantityOption')
  const showStudentNames = purchaseType === 'selfAndProxy' || purchaseType === 'proxyOnly'
  const showQuantityNote = quantityOption === 'other'

  const onSubmit = (values: CourseSessionFormValues) => {
    startTransition(async () => {
      const result = await createCourseSession(values as Record<string, unknown>)
      if (result.success && result.data) {
        toast.success(result.message ?? '開課單已建立！')
        form.reset()
        onSuccess(result.data.token)
      } else {
        toast.error(result.message ?? '建立失敗，請稍後再試')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-5 pb-2">

            {/* ── 課程邀請設定 ──────────────────────── */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">開課設定</p>

              {/* 課程選擇 */}
              <FormField control={form.control} name="courseLevel" render={({ field }) => (
                <FormItem>
                  <FormLabel>開設課程 *</FormLabel>
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
            </div>

            {/* ── 購買人基本資料 ─────────────────────── */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">教材訂購資料</p>

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

            {/* ── 教材版本 ────────────────────────────── */}
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

            {/* ── 購買性質 ────────────────────────────── */}
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

            {/* ── 學員代購姓名（條件顯示）────────────── */}
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

            {/* ── 購買數量 ────────────────────────────── */}
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

            {/* ── 自填數量（條件顯示）─────────────────── */}
            {showQuantityNote && (
              <FormField control={form.control} name="quantityNote" render={({ field }) => (
                <FormItem>
                  <FormLabel>請填寫數量 *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* ── 統一編號（選填）─────────────────────── */}
            <FormField control={form.control} name="taxId" render={({ field }) => (
              <FormItem>
                <FormLabel>統一編號（若有報帳需求）</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── 取貨方式 ────────────────────────────── */}
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
          {isPending ? '建立中…' : '建立開課單'}
        </Button>
      </form>
    </Form>
  )
}
