/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 課程邀請
 * 2026-03-23
 * lib/schemas/course-invite.ts
 * ----------------------------------------------
 */

import { z } from 'zod'
import { COURSE_LEVEL_VALUES } from '@/config/course-catalog'

export const createInviteSchema = z.object({
  courseLevel: z.enum(COURSE_LEVEL_VALUES as [string, ...string[]], {
    error: '請選擇課程',
  }),
  maxCount: z
    .string()
    .min(1, '預計人數為必填')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1, '預計人數須為正整數')),
  courseOrderId: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
})

export type CreateInviteValues = z.infer<typeof createInviteSchema>
