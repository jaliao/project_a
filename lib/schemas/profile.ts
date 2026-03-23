/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 個人資料相關
 * 2026-03-23
 * lib/schemas/profile.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

export const updateProfileSchema = z.object({
  realName: z.string().min(1, '真實姓名為必填'),
  nickname: z.string().max(20, '暱稱不可超過 20 個字').optional(),
  phone: z
    .string()
    .regex(/^(09\d{8}|\+8869\d{8})$/, '請輸入有效的台灣手機號碼（09xxxxxxxx 或 +886xxxxxxxxx）')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
})

export const commEmailSchema = z.object({
  commEmail: z.string().email('請輸入有效的 Email 格式'),
})
