/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 新增開課（合併訂購與邀請）
 * 2026-03-23
 * lib/schemas/course-session.ts
 * ----------------------------------------------
 */

import { z } from 'zod'
import { COURSE_LEVEL_VALUES } from '@/config/course-catalog'

export const courseSessionSchema = z
  .object({
    // ── 課程邀請欄位 ──────────────────────────────
    courseLevel: z.enum(COURSE_LEVEL_VALUES as [string, ...string[]], {
      error: '請選擇課程',
    }),
    maxCount: z
      .string()
      .min(1, '預計人數為必填')
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
        message: '預計人數須為正整數',
      }),
    expiredAt: z.date({ error: '請選擇邀請截止日期' }),

    // ── 課程訂購欄位 ──────────────────────────────
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

    quantityOption: z.string().min(1, '請選擇購買數量'),
    quantityNote: z.string().optional(),

    courseDate: z.date({ error: '請選擇預計開課日期' }),
    taxId: z.string().optional(),

    deliveryMethod: z.enum(['sevenEleven', 'familyMart', 'delivery'], {
      error: '請選擇取貨方式',
    }),
  })
  .superRefine((data, ctx) => {
    // 含代購時，學員姓名必填
    if (
      (data.purchaseType === 'selfAndProxy' || data.purchaseType === 'proxyOnly') &&
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

    // 邀請截止日期不可早於今天
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (data.expiredAt < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '截止日期不可早於今天',
        path: ['expiredAt'],
      })
    }
  })

export type CourseSessionFormValues = z.infer<typeof courseSessionSchema>
