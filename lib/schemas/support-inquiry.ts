/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 聯繫管理者（學員提問）
 * 2026-07-22
 * lib/schemas/support-inquiry.ts
 *
 * 驗證訊息為 i18n key（validation.* 命名空間），由呈現端 t() 翻譯（見 CLAUDE.md 第 12 點）
 * ----------------------------------------------
 */

import { z } from 'zod'

export const createInquirySchema = z.object({
  category: z.enum(['account', 'course', 'material', 'other'], {
    error: 'validation.inquiryCategoryRequired',
  }),
  body: z.string().min(1, 'validation.inquiryBodyRequired'),
})

export type CreateInquiryFormValues = z.infer<typeof createInquirySchema>

export const replyInquirySchema = z.object({
  replyBody: z.string().min(1, 'validation.inquiryReplyRequired'),
})

export type ReplyInquiryFormValues = z.infer<typeof replyInquirySchema>
