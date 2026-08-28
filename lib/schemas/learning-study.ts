/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 我的學習（分段查經筆記）
 * 2026-08-28
 * lib/schemas/learning-study.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 驗證訊息為 i18n key（validation.* 命名空間），由呈現端 t() 翻譯（見 CLAUDE.md 第 12 點）

const FIELD_MAX = 5000

// 選填多行純文字欄位：空字串亦視為未填
const optionalLongText = z
  .string()
  .trim()
  .max(FIELD_MAX, 'validation.studyFieldTooLong')
  .optional()
  .or(z.literal(''))

// 分段查經筆記內容欄位（新增與編輯共用）
export const studyEntryContentSchema = z.object({
  mainTitle: z
    .string()
    .trim()
    .min(1, 'validation.studyMainTitleRequired')
    .max(200, 'validation.studyMainTitleTooLong'),
  subTitle: optionalLongText,
  wordReceived: optionalLongText,
  application: optionalLongText,
})

// 新增筆記：內容欄位 + 大綱位置
export const createStudyEntrySchema = studyEntryContentSchema.extend({
  courseCatalogId: z.coerce.number().int().positive(),
  lessonKey: z.string().min(1),
  scriptureKey: z.string().min(1),
})

export type StudyEntryContentInput = z.infer<typeof studyEntryContentSchema>
export type CreateStudyEntryInput = z.infer<typeof createStudyEntrySchema>
