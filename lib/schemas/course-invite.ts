/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 課程邀請
 * 2026-03-23 (Updated: 2026-03-30)
 * lib/schemas/course-invite.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

export const createInviteSchema = z.object({
  courseCatalogId: z
    .string()
    .min(1, '請選擇課程')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive('請選擇課程')),
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

// 講師資格回饋（由課程建立者對已結業學員填寫）
export const instructorFeedbackSchema = z.object({
  enrollmentId: z.number().int().positive(),
  recommended: z.boolean(),
  note: z.string().trim().max(500, '備註最多 500 字').optional(),
})

export type InstructorFeedbackValues = z.infer<typeof instructorFeedbackSchema>
