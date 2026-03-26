/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 新增授課
 * 2026-03-23 (Updated: 2026-03-26)
 * lib/schemas/course-session.ts
 * ----------------------------------------------
 */

import { z } from 'zod'
import { COURSE_LEVEL_VALUES } from '@/config/course-catalog'

export const courseSessionSchema = z
  .object({
    courseLevel: z.enum(COURSE_LEVEL_VALUES as [string, ...string[]], {
      error: '請選擇課程',
    }),
    title: z.string().min(1, '課程名稱為必填'),
    maxCount: z
      .string()
      .min(1, '預計人數為必填')
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
        message: '預計人數須為正整數',
      }),
    expiredAt: z.date({ error: '請選擇邀請截止日期' }),
    courseDate: z.date({ error: '請選擇預計開課日期' }),
    notes: z.string().optional(),
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
