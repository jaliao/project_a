/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 學習歷程回饋
 * 2026-07-02
 * lib/schemas/learning-feedback.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 回饋類別（與 Prisma enum FeedbackCategory 對齊）
export const FEEDBACK_CATEGORIES = ['missing_record', 'wrong_teacher', 'not_graduated'] as const
export type FeedbackCategoryValue = (typeof FEEDBACK_CATEGORIES)[number]

// 學員送出回饋（訊息為 validation.* i18n key，由 <FieldError> 翻譯）
export const learningFeedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES, { error: 'validation.feedbackCategoryRequired' }),
  teacherName: z
    .string()
    .trim()
    .min(1, 'validation.feedbackTeacherRequired')
    .max(50, 'validation.feedbackTeacherMax'),
  courseCatalogId: z.coerce
    .number({ error: 'validation.feedbackCourseRequired' })
    .int('validation.feedbackCourseRequired')
    .positive('validation.feedbackCourseRequired'),
  note: z.string().trim().max(500, 'validation.feedbackNoteMax').optional(),
})

// 輸出型別（courseCatalogId 已強制轉 number）與輸入型別（表單原始值，coerce 前）
export type LearningFeedbackFormValues = z.output<typeof learningFeedbackSchema>
export type LearningFeedbackFormInput = z.input<typeof learningFeedbackSchema>
