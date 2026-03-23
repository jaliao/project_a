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
