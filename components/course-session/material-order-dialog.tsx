/*
 * ----------------------------------------------
 * MaterialOrderDialog - 教材申請 Dialog
 * 2026-03-30 (Updated: 2026-04-02)
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
import {
  materialOrderSchema,
  type MaterialOrderFormValues,
} from '@/lib/schemas/course-order'
import { applyMaterialOrder } from '@/app/actions/course-order'
import { EcpayStoreSelector } from '@/components/ecpay-store-selector/store-selector'

interface MaterialOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteId: number
  // 現有 CourseOrder（修改模式）
  existingOrder?: {
    taxId: string | null
    deliveryMethod: string
    deliveryAddress: string | null
    storeId: string | null
    storeName: string | null
    shippedAt: Date | null
  } | null
}

export function MaterialOrderDialog({
  open,
  onOpenChange,
  inviteId,
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
          taxId: existingOrder.taxId ?? '',
          deliveryMethod: existingOrder.deliveryMethod as MaterialOrderFormValues['deliveryMethod'],
          deliveryAddress: existingOrder.deliveryAddress ?? '',
          storeId: existingOrder.storeId ?? '',
          storeName: existingOrder.storeName ?? '',
        }
      : {
          taxId: '',
          deliveryAddress: '',
          storeId: '',
          storeName: '',
        },
  })

  const deliveryMethod = form.watch('deliveryMethod')
  const isCVS = deliveryMethod === 'sevenEleven' || deliveryMethod === 'familyMart'
  const cvsSubType = deliveryMethod === 'sevenEleven' ? 'UNIMART' : 'FAMI'

  // 切換取貨方式時清除不對應的欄位
  function handleDeliveryMethodChange(value: string) {
    form.setValue('deliveryMethod', value as MaterialOrderFormValues['deliveryMethod'])
    // 切換後清除門市與地址（避免殘留舊值）
    form.setValue('storeId', '')
    form.setValue('storeName', '')
    form.setValue('deliveryAddress', '')
  }

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
            <div className="space-y-5">

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
                        onValueChange={handleDeliveryMethodChange}
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

                {/* ── 超商門市選擇器（7-11 / 全家）──────── */}
                {isCVS && (
                  <FormField control={form.control} name="storeId" render={() => (
                    <FormItem>
                      <FormLabel>取貨門市 *</FormLabel>
                      <FormControl>
                        <EcpayStoreSelector
                          logisticsSubType={cvsSubType}
                          value={
                            form.watch('storeId') && form.watch('storeName')
                              ? { storeId: form.watch('storeId')!, storeName: form.watch('storeName')! }
                              : null
                          }
                          onChange={(store) => {
                            form.setValue('storeId', store?.storeId ?? '')
                            form.setValue('storeName', store?.storeName ?? '')
                          }}
                          disabled={isReadonly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {/* ── 地址（郵寄用）──────────────────────── */}
                {!isCVS && (
                  <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>收件地址 *</FormLabel>
                      <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

            </div>

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
