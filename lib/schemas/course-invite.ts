/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 課程邀請
 * 2026-03-23
 * lib/schemas/course-invite.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

export const createInviteSchema = z.object({
  title: z.string().min(1, '課程名稱為必填'),
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
