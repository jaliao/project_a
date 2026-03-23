/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 認證相關
 * 2026-03-23
 * lib/schemas/auth.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('請輸入有效的 Email 格式'),
})

export const loginSchema = z.object({
  email: z.string().email('請輸入有效的 Email 格式'),
  password: z.string().min(1, '請輸入密碼'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '請輸入目前密碼'),
    newPassword: z.string().min(8, '新密碼至少需 8 字元'),
    confirmPassword: z.string().min(1, '請確認新密碼'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '兩次輸入的密碼不一致',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: '新密碼不可與目前密碼相同',
    path: ['newPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('請輸入有效的 Email 格式'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8, '新密碼至少需 8 字元'),
    confirmPassword: z.string().min(1, '請確認新密碼'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '兩次輸入的密碼不一致',
    path: ['confirmPassword'],
  })
