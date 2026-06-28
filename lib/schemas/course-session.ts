/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 新增授課
 * 2026-03-23 (Updated: 2026-03-30)
 * lib/schemas/course-session.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

export const courseSessionSchema = z
  .object({
    courseCatalogId: z.number().int().positive({ message: '請選擇課程' }),
    title: z.string().min(1, '課程名稱為必填'),
    maxCount: z
      .string()
      .min(1, '預計人數為必填')
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 7, {
        message: '預計人數須為 1–7（每班最多 7 人）',
      }),
    expiredAt: z.date({ error: '請選擇邀請截止日期' }),
    courseDate: z.date({ error: '請選擇預計開課日期' }),
    notes: z.string().optional(),
    // 公開媒合（布告欄招募）
    isPublicMatch: z.boolean(),
    matchNote: z.string().trim().max(500, '招募備註最長 500 字').optional(),
  })
  .superRefine((data, ctx) => {
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

// ── 招生階段編輯課程資訊（名稱／人數／截止日／開課日／備註；不含書本）──
// maxCount 上限 7；「不得低於已核准學員數」屬執行期資料相依，於 server action 驗證
export const editCourseInfoSchema = z
  .object({
    title: z.string().min(1, '課程名稱為必填'),
    maxCount: z.coerce
      .number({ error: '預計人數須為正整數' })
      .int('預計人數須為正整數')
      .min(1, '預計人數須為正整數')
      .max(7, '每班最多 7 人'),
    expiredAt: z.coerce.date({ error: '請選擇邀請截止日期' }),
    courseDate: z.coerce.date({ error: '請選擇預計開課日期' }),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
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

export type EditCourseInfoValues = z.infer<typeof editCourseInfoSchema>
