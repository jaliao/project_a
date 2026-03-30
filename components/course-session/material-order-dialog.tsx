/*
 * ----------------------------------------------
 * MaterialOrderDialog - 教材申請 Dialog
 * 2026-03-30 (Updated: 2026-03-30)
 * components/course-session/material-order-dialog.tsx
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  materialOrderSchema,
  type MaterialOrderFormValues,
} from '@/lib/schemas/course-order'
import { applyMaterialOrder } from '@/app/actions/course-order'

interface MaterialOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteId: number
  // 預填資料
  prefill?: {
    buyerNameZh?: string
    buyerNameEn?: string
    email?: string
    phone?: string
    courseDate?: string
  }
  // 現有 CourseOrder（修改模式）
  existingOrder?: {
    buyerNameZh: string
    buyerNameEn: string
    teacherName: string
    churchOrg: string
    email: string
    phone: string
    courseDate: string
    taxId: string | null
    deliveryMethod: string
    deliveryAddress: string | null
    shippedAt: Date | null
  } | null
}

export function MaterialOrderDialog({
  open,
  onOpenChange,
  inviteId,
  prefill,
  existingOrder,
}: MaterialOrderDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 已寄送後設為唯讀
  const isReadonly = !!existingOrder?.shippedAt

  const form = useForm<MaterialOrderFormValues>({
    resolver: zodResolver(materialOrderSchema),
    defaultValues: existingOrder
      ? {
          buyerNameZh: existingOrder.buyerNameZh,
          buyerNameEn: existingOrder.buyerNameEn,
          teacherName: existingOrder.teacherName,
          churchOrg: existingOrder.churchOrg,
          email: existingOrder.email,
          phone: existingOrder.phone,
          courseDate: existingOrder.courseDate,
          taxId: existingOrder.taxId ?? '',
          deliveryMethod: existingOrder.deliveryMethod as MaterialOrderFormValues['deliveryMethod'],
          deliveryAddress: existingOrder.deliveryAddress ?? '',
        }
      : {
          buyerNameZh: prefill?.buyerNameZh ?? '',
          buyerNameEn: prefill?.buyerNameEn ?? '',
          teacherName: '',
          churchOrg: '',
          email: prefill?.email ?? '',
          phone: prefill?.phone ?? '',
          courseDate: prefill?.courseDate ?? '',
          taxId: '',
          deliveryAddress: '',
        },
  })

  const deliveryMethod = form.watch('deliveryMethod')
  const isConvenienceStore =
    deliveryMethod === 'sevenEleven' || deliveryMethod === 'familyMart'
  const addressLabel = isConvenienceStore ? '門市店號 / 門市名稱 *' : '收件地址 *'

  const onSubmit = (values: MaterialOrderFormValues) => {
    if (isReadonly) return
    startTransition(async () => {
      const result = await applyMaterialOrder(
        inviteId,
        values as Record<string, string>
      )
      if (result.success) {
        toast.success(result.message ?? '教材申請已送出')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? '送出失敗，請稍後再試')
      }
    })
  }

  const title = existingOrder ? '查看教材申請' : '申請教材'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isReadonly && (
          <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700">
            教材已寄出，申請資料不可修改。
          </div>
        )}

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
                      <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="buyerNameEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>購買人英文姓名 *</FormLabel>
                      <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="teacherName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>購買人的教師姓名 *</FormLabel>
                      <p className="text-xs text-muted-foreground -mt-1">請填寫您的教師姓名，而非您的姓名</p>
                      <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="churchOrg" render={({ field }) => (
                    <FormItem>
                      <FormLabel>所屬教會/單位 *</FormLabel>
                      <p className="text-xs text-muted-foreground -mt-1">例：101、心欣、Kua、全福會…</p>
                      <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>購買人 Email *</FormLabel>
                      <FormControl><Input type="email" {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>購買人聯絡電話 *</FormLabel>
                      <FormControl><Input type="tel" {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* ── 預計開課日期 ──────────────────────── */}
                <FormField control={form.control} name="courseDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>預計開課日期 *</FormLabel>
                    <p className="text-xs text-muted-foreground -mt-1">暫無開課計畫請填「無」</p>
                    <FormControl>
                      <Input placeholder="例：2026-05-01 或 無" {...field} disabled={isReadonly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* ── 統一編號（選填） ──────────────────── */}
                <FormField control={form.control} name="taxId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>統一編號（若有報帳需求）</FormLabel>
                    <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* ── 取貨方式 ──────────────────────────── */}
                <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
                  <FormItem>
                    <FormLabel>取貨方式 *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-1"
                        disabled={isReadonly}
                      >
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

                {/* ── 地址（依取貨方式動態 label）────────── */}
                <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{addressLabel}</FormLabel>
                    <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>
            </ScrollArea>

            {!isReadonly && (
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? '送出中…' : existingOrder ? '更新申請' : '送出申請'}
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
