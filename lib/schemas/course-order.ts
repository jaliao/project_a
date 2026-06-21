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

// ── 單筆寄送地址（多地址模式用）──────────────────────────────────────
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
    traditionalQty: z.number().int().min(0, '本數不可為負'),
    simplifiedQty: z.number().int().min(0, '本數不可為負'),
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
    // 多地址批次
    shipments: z.array(shipmentItemSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shipMode === 'multiple') {
      if (!data.shipments || data.shipments.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請至少新增一個寄送地址', path: ['shipments'] })
      }
      return
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

// ── 管理者編輯教材申請 Schema ─────────────────────────────────────────
export const adminMaterialOrderEditSchema = z.object({
  buyerNameZh: z.string().min(1, '購買人中文姓名為必填'),
  buyerNameEn: z.string().min(1, '購買人英文姓名為必填'),
  teacherName: z.string().min(1, '教師姓名為必填'),
  churchOrg: z.string().min(1, '所屬教會/單位為必填'),
  email: z.string().email('請輸入有效的 Email 格式'),
  phone: z.string().min(1, '聯絡電話為必填'),
  courseDate: z.string().min(1, '預計開課日期為必填'),
  taxId: z.string().optional(),
})

export type AdminMaterialOrderEditValues = z.infer<typeof adminMaterialOrderEditSchema>
