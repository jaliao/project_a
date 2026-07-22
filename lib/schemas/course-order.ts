/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 課程訂購
 * 2026-03-23
 * lib/schemas/course-order.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

export const courseOrderSchema = z
  .object({
    buyerNameZh: z.string().min(1, '購買人中文姓名為必填'),
    buyerNameEn: z.string().min(1, '購買人英文姓名為必填'),
    teacherName: z.string().min(1, '教師姓名為必填'),
    churchOrg: z.string().min(1, '所屬教會/單位為必填'),
    email: z.string().email('請輸入有效的 Email 格式'),
    phone: z.string().min(1, '聯絡電話為必填'),

    materialVersion: z.enum(['traditional', 'simplified', 'both'], {
      error: '請選擇教材版本',
    }),

    purchaseType: z.enum(['selfOnly', 'selfAndProxy', 'proxyOnly'], {
      error: '請選擇購買性質',
    }),
    studentNames: z.string().optional(),

    // 數量：'1'~'8' 或 'other'
    quantityOption: z.string().min(1, '請選擇購買數量'),
    quantityNote: z.string().optional(),

    courseDate: z.string().min(1, '預計開課日期為必填'),
    taxId: z.string().optional(),

    deliveryMethod: z.enum(['sevenEleven', 'familyMart', 'delivery'], {
      error: '請選擇取貨方式',
    }),
  })
  .superRefine((data, ctx) => {
    // 含代購時，學員姓名必填
    if (
      (data.purchaseType === 'selfAndProxy' ||
        data.purchaseType === 'proxyOnly') &&
      !data.studentNames?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '請填寫學員完整中文姓名',
        path: ['studentNames'],
      })
    }

    // 選「其他」數量時，自填說明必填
    if (data.quantityOption === 'other' && !data.quantityNote?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '請填寫購買數量',
        path: ['quantityNote'],
      })
    }
  })

export type CourseOrderFormValues = z.infer<typeof courseOrderSchema>

// ── 申請書本項目（單一/多地址共用）──────────────────────────────────
// enrollment：學員書（版本可覆寫，繁↔簡）；extra：額外加購（不綁學員）
export const orderBookItemInputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('enrollment'),
    enrollmentId: z.number().int(),
    version: z.enum(['traditional', 'simplified', 'english'], { error: '請選擇版本' }),
  }),
  z.object({
    kind: z.literal('extra'),
    version: z.enum(['traditional', 'simplified', 'english'], { error: '請選擇版本' }),
    bookName: z.string().optional(),
  }),
])

export type OrderBookItemInput = z.infer<typeof orderBookItemInputSchema>

// ── 單筆寄送地址（多地址模式用）──────────────────────────────────────
// 逐本指派：每地址帶指派到此地址的書本項目（含版本覆寫與加購）；繁/簡本數由項目推導
export const shipmentItemSchema = z
  .object({
    recipientName: z.string().min(1, '請填寫收件人'),
    recipientPhone: z.string().min(1, '請填寫連絡電話'),
    deliveryMethod: z.enum(['sevenEleven', 'familyMart', 'delivery'], {
      error: '請選擇取貨方式',
    }),
    deliveryAddress: z.string().optional(),
    storeId: z.string().optional(),
    storeName: z.string().optional(),
    items: z.array(orderBookItemInputSchema).min(1, '請至少指派一本書至此地址'),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'sevenEleven' || data.deliveryMethod === 'familyMart') {
      if (!data.storeId?.trim() || !data.storeName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請選取取貨門市', path: ['storeId'] })
      }
    } else if (!data.deliveryAddress?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請填寫收件地址', path: ['deliveryAddress'] })
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
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請至少新增一個寄送地址', path: ['shipments'] })
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
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請至少申請 1 本教材', path: ['items'] })
    }
    // single：取貨方式必填 + 對應門市/地址
    if (!data.deliveryMethod) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請選擇取貨方式', path: ['deliveryMethod'] })
    } else if (data.deliveryMethod === 'sevenEleven' || data.deliveryMethod === 'familyMart') {
      if (!data.storeId?.trim() || !data.storeName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請選取取貨門市', path: ['storeId'] })
      }
    } else if (!data.deliveryAddress?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請填寫收件地址', path: ['deliveryAddress'] })
    }
  })

export type MaterialOrderFormValues = z.infer<typeof materialOrderSchema>
