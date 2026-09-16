/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 課程邀請
 * 2026-03-23 (Updated: 2026-03-30)
 * lib/schemas/course-invite.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 講師資格回饋（由課程建立者對已結業學員填寫）
export const instructorFeedbackSchema = z.object({
  enrollmentId: z.number().int().positive(),
  recommended: z.boolean(),
  note: z.string().trim().max(500, '備註最多 500 字').optional(),
})

export type InstructorFeedbackValues = z.infer<typeof instructorFeedbackSchema>
