/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 學員上課意願
 * 2026-09-14
 * lib/schemas/learning-intent.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 驗證訊息為 i18n key（validation.* 命名空間），由呈現端 t() 翻譯（見 CLAUDE.md 第 12 點）

export const LEARNING_TIME_PREFERENCE_VALUES = [
  'weekday_day',
  'weekday_night',
  'weekend',
  'anytime',
  'other',
] as const

export const learningIntentSchema = z
  .object({
    courseCatalogIds: z.array(z.number().int()).min(1, 'validation.learningIntentCoursesRequired'),
    timePreferences: z
      .array(z.enum(LEARNING_TIME_PREFERENCE_VALUES))
      .min(1, 'validation.learningIntentTimeRequired'),
    otherNote: z.string().trim().max(200, 'validation.learningIntentOtherNoteMax200').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.timePreferences.includes('other') && !data.otherNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.learningIntentOtherNoteRequired',
        path: ['otherNote'],
      })
    }
  })

export type LearningIntentInput = z.infer<typeof learningIntentSchema>
