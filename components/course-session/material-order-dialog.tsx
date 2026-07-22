/*
 * ----------------------------------------------
 * MaterialOrderDialog - 教材申請 Dialog
 * 2026-03-30 (Updated: 2026-07-20)
 * components/course-session/material-order-dialog.tsx
 *
 * 支援單一地址與多地址寄送，皆以「逐本清單」編輯本次申請內容：
 * 學員書依報名選版帶入（可改版本、取消勾選），並可新增額外加購；
 * 學員申請統計僅為參考，不作為數量上限。
 * ----------------------------------------------
 */

'use client'

import { useEffect, useTransition } from 'react'
import { useForm, useFieldArray, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
} from '@/components/ui/form'
import { FieldError } from '@/components/ui/field-error'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  materialOrderSchema,
  type MaterialOrderFormValues,
  type OrderBookItemInput,
} from '@/lib/schemas/course-order'
import { applyMaterialOrder } from '@/app/actions/course-order'
import type { BookItem } from '@/lib/data/material-items'
import { EcpayStoreSelector } from '@/components/ecpay-store-selector/store-selector'

const DELIVERY_VALUES = ['sevenEleven', 'familyMart', 'delivery'] as const

// 取貨方式選項（label 由呼叫端以 t() 組成，見 useDeliveryOptions）
function useDeliveryOptions(t: (key: string) => string) {
  return DELIVERY_VALUES.map((value) => ({
    value,
    label:
      value === 'sevenEleven'
        ? t('deliverySevenEleven')
        : value === 'familyMart'
          ? t('deliveryFamilyMart')
          : t('deliveryDelivery'),
  }))
}

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
  englishQty: number
  shippedAt: Date | null
  items?: { enrollmentId: number | null; bookName: string; version: string }[]
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
  // 學員申請尚未申請之本數（參考值，非上限）
  remaining: { traditional: number; simplified: number; english: number }
  // 尚未指派的書本項目（逐本清單／多地址指派用）
  bookItems: BookItem[]
  // 單一地址收件人預設值（申請講師姓名 + 個人資料電話）
  defaultRecipient: { name: string; phone: string }
}

// 既有訂單項目 → 表單項目（唯讀顯示用）
function toFormItems(items: Shipment['items']): OrderBookItemInput[] {
  return (items ?? []).map((i) =>
    i.enrollmentId != null
      ? { kind: 'enrollment' as const, enrollmentId: i.enrollmentId, version: i.version as 'traditional' | 'simplified' | 'english' }
      : { kind: 'extra' as const, version: i.version as 'traditional' | 'simplified' | 'english', bookName: i.bookName }
  )
}

// 書本項目繁/簡/英合計
function countItems(items: OrderBookItemInput[]): { trad: number; simp: number; eng: number } {
  return {
    trad: items.filter((i) => i.version === 'traditional').length,
    simp: items.filter((i) => i.version === 'simplified').length,
    eng: items.filter((i) => i.version === 'english').length,
  }
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
  const t = useTranslations('course.material')
  const deliveryOptions = useDeliveryOptions(t)
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
          items: [],
          shipments: existingOrder.shipments.map((s) => ({
            recipientName: s.recipientName ?? '',
            recipientPhone: s.recipientPhone ?? '',
            deliveryMethod: s.deliveryMethod as 'sevenEleven' | 'familyMart' | 'delivery',
            deliveryAddress: s.deliveryAddress ?? '',
            storeId: s.storeId ?? '',
            storeName: s.storeName ?? '',
            items: toFormItems(s.items),
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
          items: bookItems.map((it) => ({
            kind: 'enrollment' as const,
            enrollmentId: it.enrollmentId,
            version: it.version,
          })),
          shipments: [],
        },
  })

  // 開啟時以當下書本項目重設單一地址清單（頁面 refresh 後 props 更新，defaultValues 不會自動更新）
  useEffect(() => {
    if (open && !existingOrder) {
      form.setValue(
        'items',
        bookItems.map((it) => ({ kind: 'enrollment' as const, enrollmentId: it.enrollmentId, version: it.version })),
        { shouldValidate: false }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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

  // ── 本次申請項目合計（單一：items；多地址：各地址 items 加總）──
  const watchedItems = form.watch('items') ?? []
  const watchedShipments = form.watch('shipments') ?? []
  const allItems: OrderBookItemInput[] = isMultiple
    ? watchedShipments.flatMap((s) => s?.items ?? [])
    : watchedItems
  const totals = countItems(allItems)
  const anyEmptyRow = watchedShipments.some((s) => (s?.items ?? []).length === 0)
  const submitDisabled = isMultiple
    ? fields.length === 0 || anyEmptyRow || allItems.length < 1
    : allItems.length < 1

  const onSubmit = (values: MaterialOrderFormValues) => {
    if (isReadonly) return
    startTransition(async () => {
      const result = await applyMaterialOrder(
        inviteId,
        values as Record<string, unknown>
      )
      if (result.success) {
        toast.success(result.message ?? t('applySuccessFallback'))
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? t('applyFailFallback'))
      }
    })
  }

  const title = existingOrder ? t('dialogTitleView') : t('dialogTitleNew')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isReadonly && (
          <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700">
            {existingOrder?.shippedAt ? t('readonlyShipped') : t('readonlyQuoted')}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* ── 統一編號（選填） ── */}
            <FormField control={form.control} name="taxId" render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t('taxIdLabel')}</FormLabel>
                <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                <FieldError message={fieldState.error?.message} />
              </FormItem>
            )} />

            {/* ── 寄送方式：單一 / 多地址 ── */}
            <FormField control={form.control} name="shipMode" render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t('shipModeLabel')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-4"
                    disabled={isReadonly}
                  >
                    {[
                      { value: 'single', label: t('shipModeSingle') },
                      { value: 'multiple', label: t('shipModeMultiple') },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`sm-${opt.value}`} />
                        <label htmlFor={`sm-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FieldError message={fieldState.error?.message} />
              </FormItem>
            )} />

            {/* ════════ 單一地址 ════════ */}
            {!isMultiple && (
              <>
                {/* 逐本清單：依學員申請帶入，可調整版本／取消勾選／加購 */}
                {!existingOrder && (
                  <SingleBookList form={form} bookItems={bookItems} disabled={isReadonly} />
                )}

                {/* 收件人（預設帶入申請講師，可修改） */}
                <div className="flex gap-3">
                  <FormField control={form.control} name="recipientName" render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('recipientNameLabel')}</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isReadonly} /></FormControl>
                      <FieldError message={fieldState.error?.message} />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="recipientPhone" render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('recipientPhoneLabel')}</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isReadonly} /></FormControl>
                      <FieldError message={fieldState.error?.message} />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="deliveryMethod" render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('deliveryMethodLabel')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={handleDeliveryMethodChange}
                        value={field.value}
                        className="space-y-1"
                        disabled={isReadonly}
                      >
                        {deliveryOptions.map((opt) => (
                          <div key={opt.value} className="flex items-center gap-2">
                            <RadioGroupItem value={opt.value} id={`dm-${opt.value}`} />
                            <label htmlFor={`dm-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FieldError message={fieldState.error?.message} />
                  </FormItem>
                )} />

                {isCVS && (
                  <FormField control={form.control} name="storeId" render={({ fieldState }) => (
                    <FormItem>
                      <FormLabel>{t('storeLabel')}</FormLabel>
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
                      <FieldError message={fieldState.error?.message} />
                    </FormItem>
                  )} />
                )}

                {!isCVS && deliveryMethod && (
                  <FormField control={form.control} name="deliveryAddress" render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t('deliveryAddressLabel')}</FormLabel>
                      <FormControl><Input {...field} disabled={isReadonly} /></FormControl>
                      <FieldError message={fieldState.error?.message} />
                    </FormItem>
                  )} />
                )}
              </>
            )}

            {/* ════════ 多地址 ════════ */}
            {isMultiple && (
              <div className="space-y-4">
                {/* 指派提示（未指派＝本次不申請） */}
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-0.5">
                  <p className="font-medium">
                    {t('multiSummary', { count: bookItems.length })}
                  </p>
                  <p className="text-muted-foreground">{t('unassignedHint')}</p>
                </div>

                {fields.map((fieldItem, index) => (
                  <MultiAddressRow
                    key={fieldItem.id}
                    form={form}
                    index={index}
                    bookItems={bookItems}
                    deliveryOptions={deliveryOptions}
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
                        items: [],
                      })
                    }
                  >
                    <IconPlus className="mr-1 h-4 w-4" />
                    {t('addAddress')}
                  </Button>
                )}
              </div>
            )}

            {/* 合計對照列（本次申請 vs 學員申請參考） */}
            {!isReadonly && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-0.5">
                <p className="font-medium">{t('totalLine', { trad: totals.trad, simp: totals.simp, eng: totals.eng })}</p>
                <p className="text-xs text-muted-foreground">
                  {t('studentRefLine', { trad: remaining.traditional, simp: remaining.simplified, eng: remaining.english })}
                </p>
                {allItems.length < 1 && (
                  <p className="text-xs text-amber-700">{t('atLeastOne')}</p>
                )}
              </div>
            )}

            {!isReadonly && (
              <Button type="submit" className="w-full" disabled={isPending || submitDisabled}>
                {isPending ? t('submitting') : existingOrder ? t('updateSubmit') : t('submit')}
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ── 版本下拉（繁/簡/英）─────────────────────────────────────
function VersionSelect({
  value,
  onChange,
  disabled,
}: {
  value: 'traditional' | 'simplified' | 'english'
  onChange: (v: 'traditional' | 'simplified' | 'english') => void
  disabled?: boolean
}) {
  const t = useTranslations('course.material')
  return (
    <Select value={value} onValueChange={(v) => onChange(v as 'traditional' | 'simplified' | 'english')} disabled={disabled}>
      <SelectTrigger size="sm" className="w-20 shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="traditional">{t('versionShortTraditional')}</SelectItem>
        <SelectItem value="simplified">{t('versionShortSimplified')}</SelectItem>
        <SelectItem value="english">{t('versionShortEnglish')}</SelectItem>
      </SelectContent>
    </Select>
  )
}

// ── 加購項目列（版本＋書名，可移除）──────────────────────
function ExtraItemRow({
  item,
  onChange,
  onRemove,
  disabled,
}: {
  item: Extract<OrderBookItemInput, { kind: 'extra' }>
  onChange: (next: Extract<OrderBookItemInput, { kind: 'extra' }>) => void
  onRemove: () => void
  disabled?: boolean
}) {
  const t = useTranslations('course.material')
  return (
    <div className="flex items-center gap-2">
      <VersionSelect value={item.version} onChange={(v) => onChange({ ...item, version: v })} disabled={disabled} />
      <Input
        value={item.bookName ?? ''}
        onChange={(e) => onChange({ ...item, bookName: e.target.value })}
        placeholder={t('extraNamePlaceholder')}
        className="h-8 flex-1 text-sm"
        disabled={disabled}
      />
      {!disabled && (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-7 px-2 text-destructive">
          <IconTrash className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// ── 單一地址逐本清單（勾選＋版本調整＋加購）───────────────
function SingleBookList({
  form,
  bookItems,
  disabled,
}: {
  form: UseFormReturn<MaterialOrderFormValues>
  bookItems: BookItem[]
  disabled: boolean
}) {
  const t = useTranslations('course.material')
  const items: OrderBookItemInput[] = form.watch('items') ?? []
  const setItems = (next: OrderBookItemInput[]) =>
    form.setValue('items', next, { shouldValidate: true })

  const findEnrollment = (enrollmentId: number) =>
    items.find((i) => i.kind === 'enrollment' && i.enrollmentId === enrollmentId) as
      | Extract<OrderBookItemInput, { kind: 'enrollment' }>
      | undefined

  const toggle = (it: BookItem, checked: boolean) => {
    if (checked) {
      setItems([...items, { kind: 'enrollment', enrollmentId: it.enrollmentId, version: it.version }])
    } else {
      setItems(items.filter((i) => !(i.kind === 'enrollment' && i.enrollmentId === it.enrollmentId)))
    }
  }
  const setVersion = (enrollmentId: number, version: 'traditional' | 'simplified' | 'english') => {
    setItems(
      items.map((i) => (i.kind === 'enrollment' && i.enrollmentId === enrollmentId ? { ...i, version } : i))
    )
  }
  // 加購項目：以 items 內索引操作
  const extraIndexes = items
    .map((i, idx) => (i.kind === 'extra' ? idx : -1))
    .filter((idx) => idx >= 0)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t('listTitle')}</p>
      <div className="space-y-1.5 rounded-md border p-2 max-h-56 overflow-y-auto">
        {bookItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noStudentBooks')}</p>
        ) : (
          bookItems.map((it) => {
            const selected = findEnrollment(it.enrollmentId)
            return (
              <div key={it.enrollmentId} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!selected}
                  disabled={disabled}
                  onCheckedChange={(c) => toggle(it, !!c)}
                />
                <span className="flex-1 truncate">{it.studentName}（{it.bookName}）</span>
                <VersionSelect
                  value={selected?.version ?? it.version}
                  onChange={(v) => setVersion(it.enrollmentId, v)}
                  disabled={disabled || !selected}
                />
              </div>
            )
          })
        )}
      </div>

      {/* 加購（不綁學員） */}
      <div className="space-y-1.5">
        {extraIndexes.map((idx) => (
          <ExtraItemRow
            key={idx}
            item={items[idx] as Extract<OrderBookItemInput, { kind: 'extra' }>}
            onChange={(next) => setItems(items.map((i, j) => (j === idx ? next : i)))}
            onRemove={() => setItems(items.filter((_, j) => j !== idx))}
            disabled={disabled}
          />
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems([...items, { kind: 'extra', version: 'traditional', bookName: '' }])}
          >
            <IconPlus className="mr-1 h-4 w-4" />
            {t('addExtra')}
          </Button>
        )}
      </div>
      <FieldError message={form.formState.errors.items?.message} />
    </div>
  )
}

// ── 單筆多地址寄送列 ─────────────────────────────────────
function MultiAddressRow({
  form,
  index,
  bookItems,
  deliveryOptions,
  onRemove,
  disabled,
}: {
  form: UseFormReturn<MaterialOrderFormValues>
  index: number
  bookItems: BookItem[]
  deliveryOptions: { value: 'sevenEleven' | 'familyMart' | 'delivery'; label: string }[]
  onRemove: () => void
  disabled: boolean
}) {
  const t = useTranslations('course.material')
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
        <span className="text-sm font-medium">{t('addressLabel', { n: index + 1 })}</span>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-7 px-2 text-destructive">
            <IconTrash className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 收件人 / 連絡電話 */}
      <div className="flex gap-3">
        <FormField control={form.control} name={`shipments.${index}.recipientName`} render={({ field, fieldState }) => (
          <FormItem className="flex-1">
            <FormControl><Input {...field} value={field.value ?? ''} placeholder={t('recipientNameLabel')} disabled={disabled} /></FormControl>
            <FieldError message={fieldState.error?.message} />
          </FormItem>
        )} />
        <FormField control={form.control} name={`shipments.${index}.recipientPhone`} render={({ field, fieldState }) => (
          <FormItem className="flex-1">
            <FormControl><Input {...field} value={field.value ?? ''} placeholder={t('recipientPhoneLabel')} disabled={disabled} /></FormControl>
            <FieldError message={fieldState.error?.message} />
          </FormItem>
        )} />
      </div>

      {/* 取貨方式 */}
      <FormField control={form.control} name={`shipments.${index}.deliveryMethod`} render={({ field, fieldState }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              onValueChange={handleMethodChange}
              value={field.value}
              className="flex flex-wrap gap-3"
              disabled={disabled}
            >
              {deliveryOptions.map((opt) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={opt.value} id={`s${index}-${opt.value}`} />
                  <label htmlFor={`s${index}-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FieldError message={fieldState.error?.message} />
        </FormItem>
      )} />

      {/* 門市 / 地址 */}
      {isCVS ? (
        <FormField control={form.control} name={`shipments.${index}.storeId`} render={({ fieldState }) => (
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
            <FieldError message={fieldState.error?.message} />
          </FormItem>
        )} />
      ) : (
        <FormField control={form.control} name={`shipments.${index}.deliveryAddress`} render={({ field, fieldState }) => (
          <FormItem>
            <FormControl><Input {...field} placeholder={t('deliveryAddressLabel')} disabled={disabled} /></FormControl>
            <FieldError message={fieldState.error?.message} />
          </FormItem>
        )} />
      )}

      {/* 指派書本至此地址（可調版本、可加購；未指派＝本次不申請） */}
      <BookAssignList form={form} index={index} bookItems={bookItems} disabled={disabled} />
    </div>
  )
}

// ── 書本項目指派清單（每本書指派到唯一地址；可調版本、可加購）──
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
  const t = useTranslations('course.material')
  const allShipments = form.watch('shipments') ?? []
  // 學員書 enrollmentId → 已指派的地址索引
  const assignedTo = new Map<number, number>()
  allShipments.forEach((s, i) =>
    (s?.items ?? []).forEach((it: OrderBookItemInput) => {
      if (it.kind === 'enrollment') assignedTo.set(it.enrollmentId, i)
    })
  )
  const myItems: OrderBookItemInput[] = form.watch(`shipments.${index}.items`) ?? []
  const setItems = (next: OrderBookItemInput[]) =>
    form.setValue(`shipments.${index}.items`, next, { shouldValidate: true })

  const toggle = (it: BookItem, checked: boolean) => {
    if (checked) {
      setItems([...myItems, { kind: 'enrollment', enrollmentId: it.enrollmentId, version: it.version }])
    } else {
      setItems(myItems.filter((i) => !(i.kind === 'enrollment' && i.enrollmentId === it.enrollmentId)))
    }
  }
  const setVersion = (enrollmentId: number, version: 'traditional' | 'simplified' | 'english') => {
    setItems(
      myItems.map((i) => (i.kind === 'enrollment' && i.enrollmentId === enrollmentId ? { ...i, version } : i))
    )
  }
  const extraIndexes = myItems
    .map((i, idx) => (i.kind === 'extra' ? idx : -1))
    .filter((idx) => idx >= 0)

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">{t('assignTitle')}</p>
      <div className="space-y-1.5 rounded-md border p-2 max-h-48 overflow-y-auto">
        {bookItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noStudentBooks')}</p>
        ) : (
          bookItems.map((it) => {
            const owner = assignedTo.get(it.enrollmentId)
            const mine = owner === index
            const elsewhere = owner != null && owner !== index
            const myItem = mine
              ? (myItems.find((i) => i.kind === 'enrollment' && i.enrollmentId === it.enrollmentId) as
                  | Extract<OrderBookItemInput, { kind: 'enrollment' }>
                  | undefined)
              : undefined
            return (
              <div
                key={it.enrollmentId}
                className={`flex items-center gap-2 text-sm ${elsewhere ? 'opacity-40' : ''}`}
              >
                <Checkbox
                  checked={mine}
                  disabled={disabled || elsewhere}
                  onCheckedChange={(c) => toggle(it, !!c)}
                />
                <span className="flex-1 truncate">{it.studentName}（{it.bookName}）</span>
                {elsewhere ? (
                  <span className="text-xs text-muted-foreground">{t('assignedToAddress', { n: owner! + 1 })}</span>
                ) : (
                  <VersionSelect
                    value={myItem?.version ?? it.version}
                    onChange={(v) => setVersion(it.enrollmentId, v)}
                    disabled={disabled || !mine}
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 此地址的加購項目 */}
      <div className="space-y-1.5">
        {extraIndexes.map((idx) => (
          <ExtraItemRow
            key={idx}
            item={myItems[idx] as Extract<OrderBookItemInput, { kind: 'extra' }>}
            onChange={(next) => setItems(myItems.map((i, j) => (j === idx ? next : i)))}
            onRemove={() => setItems(myItems.filter((_, j) => j !== idx))}
            disabled={disabled}
          />
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems([...myItems, { kind: 'extra', version: 'traditional', bookName: '' }])}
          >
            <IconPlus className="mr-1 h-4 w-4" />
            {t('addExtra')}
          </Button>
        )}
      </div>
      <FieldError message={form.formState.errors.shipments?.[index]?.items?.message} />
    </div>
  )
}
