/*
 * ----------------------------------------------
 * MaterialOrderDialog - 教材申請 Dialog
 * 2026-03-30 (Updated: 2026-06-04)
 * components/course-session/material-order-dialog.tsx
 *
 * 支援單一地址（現行流程）與多地址寄送：
 * 多地址依教材版本（繁/簡）分配本數，分配完才能送出。
 * ----------------------------------------------
 */

'use client'

import { useTransition } from 'react'
import { useForm, useFieldArray, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconPlus, IconTrash } from '@tabler/icons-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  materialOrderSchema,
  type MaterialOrderFormValues,
} from '@/lib/schemas/course-order'
import { applyMaterialOrder } from '@/app/actions/course-order'
import type { BookItem } from '@/lib/data/material-items'
import { EcpayStoreSelector } from '@/components/ecpay-store-selector/store-selector'

const DELIVERY_OPTIONS = [
  { value: 'sevenEleven', label: '7-11 取貨' },
  { value: 'familyMart', label: '全家取貨' },
  { value: 'delivery', label: '郵寄、宅配' },
] as const

interface Shipment {
  id: number
  recipientName: string | null
  recipientPhone: string | null
  deliveryMethod: string
  deliveryAddress: string | null
  storeId: string | null
  storeName: string | null
  traditionalQty: number
  simplifiedQty: number
  shippedAt: Date | null
  items?: { enrollmentId: number; bookName: string; version: string }[]
}

interface MaterialOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteId: number
  existingOrder?: {
    taxId: string | null
    recipientName: string | null
    recipientPhone: string | null
    deliveryMethod: string
    deliveryAddress: string | null
    storeId: string | null
    storeName: string | null
    quotedAt: Date | null
    shippedAt: Date | null
    shipMode: string
    shipments: Shipment[]
  } | null
  // 尚未申請之剩餘本數（本次申請上限；單一地址自動帶入此值）
  remaining: { traditional: number; simplified: number }
  // 尚未指派的書本項目（多地址逐本指派用）
  bookItems: BookItem[]
  // 單一地址收件人預設值（申請講師姓名 + 個人資料電話）
  defaultRecipient: { name: string; phone: string }
}

export function MaterialOrderDialog({
  open,
  onOpenChange,
  inviteId,
  existingOrder,
  remaining,
  bookItems,
  defaultRecipient,
}: MaterialOrderDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 多訂單模式：既有訂單一律唯讀（不再編輯舊訂單，欲變更請「再申請一筆教材」建立新訂單）
  const isReadonly = !!existingOrder

  const isExistingMultiple = existingOrder?.shipMode === 'multiple'

  const form = useForm<MaterialOrderFormValues>({
    resolver: zodResolver(materialOrderSchema),
    defaultValues: existingOrder
      ? {
          taxId: existingOrder.taxId ?? '',
          shipMode: isExistingMultiple ? 'multiple' : 'single',
          recipientName: existingOrder.recipientName ?? defaultRecipient.name,
          recipientPhone: existingOrder.recipientPhone ?? defaultRecipient.phone,
          deliveryMethod: isExistingMultiple
            ? undefined
            : (existingOrder.deliveryMethod as MaterialOrderFormValues['deliveryMethod']),
          deliveryAddress: existingOrder.deliveryAddress ?? '',
          storeId: existingOrder.storeId ?? '',
          storeName: existingOrder.storeName ?? '',
          shipments: existingOrder.shipments.map((s) => ({
            recipientName: s.recipientName ?? '',
            recipientPhone: s.recipientPhone ?? '',
            deliveryMethod: s.deliveryMethod as 'sevenEleven' | 'familyMart' | 'delivery',
            deliveryAddress: s.deliveryAddress ?? '',
            storeId: s.storeId ?? '',
            storeName: s.storeName ?? '',
            enrollmentIds: (s.items ?? []).map((i) => i.enrollmentId),
          })),
        }
      : {
          taxId: '',
          shipMode: 'single',
          recipientName: defaultRecipient.name,
          recipientPhone: defaultRecipient.phone,
          deliveryAddress: '',
          storeId: '',
          storeName: '',
          shipments: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'shipments',
  })

  const shipMode = form.watch('shipMode')
  const isMultiple = shipMode === 'multiple'

  // ── 單一地址欄位 ──
  const deliveryMethod = form.watch('deliveryMethod')
  const isCVS = deliveryMethod === 'sevenEleven' || deliveryMethod === 'familyMart'
  const cvsSubType = deliveryMethod === 'sevenEleven' ? 'UNIMART' : 'FAMI'

  function handleDeliveryMethodChange(value: string) {
    form.setValue('deliveryMethod', value as MaterialOrderFormValues['deliveryMethod'])
    form.setValue('storeId', '')
    form.setValue('storeName', '')
    form.setValue('deliveryAddress', '')
  }

  // ── 多地址：逐本指派（每本書指派到唯一地址，需全部指派完）──
  const watchedShipments = form.watch('shipments') ?? []
  const assignedIds = new Set<number>()
  watchedShipments.forEach((s) => (s?.enrollmentIds ?? []).forEach((id: number) => assignedIds.add(id)))
  const totalItems = bookItems.length
  const unassignedCount = totalItems - assignedIds.size
  const anyEmptyRow = watchedShipments.some((s) => (s?.enrollmentIds ?? []).length === 0)
  const multipleSubmitDisabled =
    isMultiple && (fields.length === 0 || totalItems === 0 || unassignedCount !== 0 || anyEmptyRow)

  const onSubmit = (values: MaterialOrderFormValues) => {
    if (isReadonly) return
    startTransition(async () => {
      const result = await applyMaterialOrder(
        inviteId,
        values as Record<string, unknown>
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isReadonly && (
          <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700">
            {existingOrder?.shippedAt ? '教材已寄出，申請資料不可修改。' : '已批價，申請資料不可修改。'}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* ── 統一編號（選填） ── */}
            <FormField control={form.control} name="taxId" render={({ field }) => (
              <FormItem>
                <FormLabel>統一編號（若有報帳需求）</FormLabel>
                <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── 寄送方式：單一 / 多地址 ── */}
            <FormField control={form.control} name="shipMode" render={({ field }) => (
              <FormItem>
                <FormLabel>寄送方式 *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-4"
                    disabled={isReadonly}
                  >
                    {[
                      { value: 'single', label: '寄送單一地址' },
                      { value: 'multiple', label: '寄送多個地址' },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`sm-${opt.value}`} />
                        <label htmlFor={`sm-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ════════ 單一地址 ════════ */}
            {!isMultiple && (
              <>
                {/* 單一地址自動帶入尚未申請的全部本數 */}
                {!existingOrder && (
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    本次將申請（系統自動帶入尚未申請的全部）：繁體 {remaining.traditional} 本、簡體 {remaining.simplified} 本
                  </div>
                )}

                {/* 收件人（預設帶入申請講師，可修改） */}
                <div className="flex gap-3">
                  <FormField control={form.control} name="recipientName" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>收件人 *</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="recipientPhone" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>連絡電話 *</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

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
                        {DELIVERY_OPTIONS.map((opt) => (
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
                            // 以實際選取門市的通路校正取貨方式，避免方式與門市不一致
                            if (store?.logisticsSubType) {
                              form.setValue(
                                'deliveryMethod',
                                store.logisticsSubType === 'UNIMART' ? 'sevenEleven' : 'familyMart',
                              )
                            }
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

                {!isCVS && deliveryMethod && (
                  <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>收件地址 *</FormLabel>
                      <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </>
            )}

            {/* ════════ 多地址 ════════ */}
            {isMultiple && (
              <div className="space-y-4">
                {/* 待指派提示 */}
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-0.5">
                  <p className="font-medium">本次待寄送書本：{totalItems} 本（繁 {remaining.traditional} / 簡 {remaining.simplified}）</p>
                  <p className={unassignedCount > 0 ? 'text-amber-700' : 'text-green-600'}>
                    {unassignedCount > 0 ? `尚有 ${unassignedCount} 本未指派地址` : '所有書本已指派 ✓'}
                  </p>
                </div>

                {fields.map((fieldItem, index) => (
                  <MultiAddressRow
                    key={fieldItem.id}
                    form={form}
                    index={index}
                    bookItems={bookItems}
                    onRemove={() => remove(index)}
                    disabled={isReadonly}
                  />
                ))}

                {!isReadonly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        recipientName: '',
                        recipientPhone: '',
                        deliveryMethod: 'delivery',
                        deliveryAddress: '',
                        storeId: '',
                        storeName: '',
                        enrollmentIds: [],
                      })
                    }
                  >
                    <IconPlus className="mr-1 h-4 w-4" />
                    新增寄送地址
                  </Button>
                )}
              </div>
            )}

            {!isReadonly && (
              <Button type="submit" className="w-full" disabled={isPending || multipleSubmitDisabled}>
                {isPending ? '送出中…' : existingOrder ? '更新申請' : '送出申請'}
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── 單筆多地址寄送列 ─────────────────────────────────────
function MultiAddressRow({
  form,
  index,
  bookItems,
  onRemove,
  disabled,
}: {
  form: UseFormReturn<MaterialOrderFormValues>
  index: number
  bookItems: BookItem[]
  onRemove: () => void
  disabled: boolean
}) {
  const method = form.watch(`shipments.${index}.deliveryMethod`)
  const isCVS = method === 'sevenEleven' || method === 'familyMart'
  const cvsSubType = method === 'sevenEleven' ? 'UNIMART' : 'FAMI'

  function handleMethodChange(value: string) {
    form.setValue(`shipments.${index}.deliveryMethod`, value as 'sevenEleven' | 'familyMart' | 'delivery')
    form.setValue(`shipments.${index}.storeId`, '')
    form.setValue(`shipments.${index}.storeName`, '')
    form.setValue(`shipments.${index}.deliveryAddress`, '')
  }

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">寄送地址 {index + 1}</span>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-7 px-2 text-destructive">
            <IconTrash className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 收件人 / 連絡電話 */}
      <div className="flex gap-3">
        <FormField control={form.control} name={`shipments.${index}.recipientName`} render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl><Input {...field} value={field.value ?? ''} placeholder="收件人 *" disabled={disabled} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={`shipments.${index}.recipientPhone`} render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl><Input {...field} value={field.value ?? ''} placeholder="連絡電話 *" disabled={disabled} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* 取貨方式 */}
      <FormField control={form.control} name={`shipments.${index}.deliveryMethod`} render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              onValueChange={handleMethodChange}
              value={field.value}
              className="flex flex-wrap gap-3"
              disabled={disabled}
            >
              {DELIVERY_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={opt.value} id={`s${index}-${opt.value}`} />
                  <label htmlFor={`s${index}-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* 門市 / 地址 */}
      {isCVS ? (
        <FormField control={form.control} name={`shipments.${index}.storeId`} render={() => (
          <FormItem>
            <FormControl>
              <EcpayStoreSelector
                logisticsSubType={cvsSubType}
                value={
                  form.watch(`shipments.${index}.storeId`) && form.watch(`shipments.${index}.storeName`)
                    ? {
                        storeId: form.watch(`shipments.${index}.storeId`)!,
                        storeName: form.watch(`shipments.${index}.storeName`)!,
                      }
                    : null
                }
                onChange={(store) => {
                  // 以實際選取門市的通路校正取貨方式，避免方式與門市不一致
                  if (store?.logisticsSubType) {
                    form.setValue(
                      `shipments.${index}.deliveryMethod`,
                      store.logisticsSubType === 'UNIMART' ? 'sevenEleven' : 'familyMart',
                    )
                  }
                  form.setValue(`shipments.${index}.storeId`, store?.storeId ?? '')
                  form.setValue(`shipments.${index}.storeName`, store?.storeName ?? '')
                }}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      ) : (
        <FormField control={form.control} name={`shipments.${index}.deliveryAddress`} render={({ field }) => (
          <FormItem>
            <FormControl><Input {...field} placeholder="收件地址" disabled={disabled} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      )}

      {/* 指派書本至此地址 */}
      <BookAssignList form={form} index={index} bookItems={bookItems} disabled={disabled} />
    </div>
  )
}

// ── 書本項目指派清單（每本書指派到唯一地址）─────────────
function BookAssignList({
  form,
  index,
  bookItems,
  disabled,
}: {
  form: UseFormReturn<MaterialOrderFormValues>
  index: number
  bookItems: BookItem[]
  disabled: boolean
}) {
  const allShipments = form.watch('shipments') ?? []
  const assignedTo = new Map<number, number>()
  allShipments.forEach((s, i) => (s?.enrollmentIds ?? []).forEach((id: number) => assignedTo.set(id, i)))
  const myIds: number[] = form.watch(`shipments.${index}.enrollmentIds`) ?? []

  const toggle = (id: number, checked: boolean) => {
    const next = checked ? [...myIds, id] : myIds.filter((x) => x !== id)
    form.setValue(`shipments.${index}.enrollmentIds`, next, { shouldValidate: true })
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">指派書本至此地址 *</p>
      <div className="space-y-1 rounded-md border p-2 max-h-48 overflow-y-auto">
        {bookItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">無待指派書本</p>
        ) : (
          bookItems.map((it) => {
            const owner = assignedTo.get(it.enrollmentId)
            const mine = owner === index
            const elsewhere = owner != null && owner !== index
            const versionLabel = it.version === 'traditional' ? '繁' : '簡'
            return (
              <label
                key={it.enrollmentId}
                className={`flex items-center gap-2 text-sm ${elsewhere ? 'opacity-40' : ''}`}
              >
                <Checkbox
                  checked={mine}
                  disabled={disabled || elsewhere}
                  onCheckedChange={(c) => toggle(it.enrollmentId, !!c)}
                />
                <span>{it.studentName}（{it.bookName}）· {versionLabel}</span>
                {elsewhere && <span className="text-xs text-muted-foreground">→ 地址 {owner! + 1}</span>}
              </label>
            )
          })
        )}
      </div>
      <FormMessage>{form.formState.errors.shipments?.[index]?.enrollmentIds?.message}</FormMessage>
    </div>
  )
}
