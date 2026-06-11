/*
 * ----------------------------------------------
 * Zod Schema - 課程 FAQ 留言驗證
 * 2026-06-11
 * lib/schemas/course-message.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

export const courseMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, '請填寫內容')
    .max(2000, '內容最長 2000 字'),
})

export type CourseMessageInput = z.infer<typeof courseMessageSchema>
