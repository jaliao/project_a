/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 站內訊息
 * 2026-08-03
 * lib/schemas/conversation.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 驗證訊息為 i18n key（validation.* 命名空間），由呈現端 t() 翻譯（見 CLAUDE.md 第 12 點）

export const conversationMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'validation.conversationMessageRequired')
    .max(2000, 'validation.conversationMessageMax2000'),
})

export type ConversationMessageInput = z.infer<typeof conversationMessageSchema>
