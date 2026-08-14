/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 課程訂購
 * 2026-03-23
 * lib/schemas/course-order.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// ── 申請書本項目（單一/多地址共用）──────────────────────────────────
// enrollment：學員書（版本可覆寫，繁↔簡）；extra：額外加購（不綁學員）
export const orderBookItemInputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('enrollment'),
    enrollmentId: z.number().int(),
    version: z.enum(['traditional', 'simplified', 'english'], { error: 'validation.versionRequired' }),
  }),
  z.object({
    kind: z.literal('extra'),
    version: z.enum(['traditional', 'simplified', 'english'], { error: 'validation.versionRequired' }),
    bookName: z.string().trim().min(1, 'validation.bookNameRequired'),
  }),
])

export type OrderBookItemInput = z.infer<typeof orderBookItemInputSchema>

// ── 單筆寄送地址（多地址模式用）──────────────────────────────────────
// 逐本指派：每地址帶指派到此地址的書本項目（含版本覆寫與加購）；繁/簡本數由項目推導
export const shipmentItemSchema = z
  .object({
    recipientName: z.string().min(1, 'validation.recipientNameRequired'),
    recipientPhone: z.string().min(1, 'validation.recipientPhoneRequired'),
    deliveryMethod: z.enum(['sevenEleven', 'familyMart', 'delivery'], {
      error: 'validation.deliveryMethodRequired',
    }),
    deliveryAddress: z.string().optional(),
    storeId: z.string().optional(),
    storeName: z.string().optional(),
    items: z.array(orderBookItemInputSchema).min(1, 'validation.atLeastOneBookPerAddress'),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'sevenEleven' || data.deliveryMethod === 'familyMart') {
      if (!data.storeId?.trim() || !data.storeName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.storeRequired', path: ['storeId'] })
      }
    } else if (!data.deliveryAddress?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.deliveryAddressRequired', path: ['deliveryAddress'] })
    }
  })

export type ShipmentItemValues = z.infer<typeof shipmentItemSchema>

// ── 寬鬆版寄送項目（僅定義欄位形狀，無必填/min 限制）──────────────────
// 與 shipmentItemSchema 欄位一一對應（嚴格版為驗證的單一事實來源）。
// materialOrderSchema 以此接收表單殘留資料：single 模式下切換模式殘留的
// 多地址列不得觸發驗證；multiple 模式的逐列嚴格驗證改於 superRefine 內
// 以 shipmentItemSchema.safeParse 執行（見下方 materialOrderSchema）
const shipmentItemLooseSchema = z.object({
  recipientName: z.string(),
  recipientPhone: z.string(),
  deliveryMethod: z.enum(['sevenEleven', 'familyMart', 'delivery']),
  deliveryAddress: z.string().optional(),
  storeId: z.string().optional(),
  storeName: z.string().optional(),
  items: z.array(orderBookItemInputSchema),
})

// ── 教材申請 Schema（學員僅填取貨資訊，其餘由 Server Action 自動帶入）────
// 支援 single（單一地址，現行流程）與 multiple（多地址批次）兩種寄送模式
export const materialOrderSchema = z
  .object({
    taxId: z.string().optional(),
    shipMode: z.enum(['single', 'multiple']),
    // 單一地址收件人（可空，Server Action 以申請講師資料回填）
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional(),
    // 單一地址欄位
    deliveryMethod: z.enum(['sevenEleven', 'familyMart', 'delivery']).optional(),
    deliveryAddress: z.string().optional(),
    storeId: z.string().optional(),
    storeName: z.string().optional(),
    // 單一地址：本次申請的書本項目清單（勾選的學員書＋加購）
    items: z.array(orderBookItemInputSchema).optional(),
    // 多地址批次（寬鬆版：逐列必填驗證僅於 multiple 模式在 superRefine 執行）
    shipments: z.array(shipmentItemLooseSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shipMode === 'multiple') {
      if (!data.shipments || data.shipments.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.atLeastOneAddress', path: ['shipments'] })
        return
      }
      // 逐列以嚴格版驗證並轉發 issues（path 對回 shipments[i].<欄位>）；
      // single 模式不進此分支，殘留列不驗證、不阻擋送出
      data.shipments.forEach((item, i) => {
        const result = shipmentItemSchema.safeParse(item)
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: ['shipments', i, ...issue.path],
            })
          }
        }
      })
      return
    }
    // single：至少申請 1 本（勾選學員書或加購）
    if (!data.items || data.items.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.atLeastOneMaterial', path: ['items'] })
    }
    // single：取貨方式必填 + 對應門市/地址
    if (!data.deliveryMethod) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.deliveryMethodRequired', path: ['deliveryMethod'] })
    } else if (data.deliveryMethod === 'sevenEleven' || data.deliveryMethod === 'familyMart') {
      if (!data.storeId?.trim() || !data.storeName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.storeRequired', path: ['storeId'] })
      }
    } else if (!data.deliveryAddress?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.deliveryAddressRequired', path: ['deliveryAddress'] })
    }
  })

export type MaterialOrderFormValues = z.infer<typeof materialOrderSchema>
