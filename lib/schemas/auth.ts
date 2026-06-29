/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 認證相關
 * 2026-03-23
 * lib/schemas/auth.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 驗證訊息為 i18n key（validation.* 命名空間），由呈現端 t() 翻譯（見 CLAUDE.md 第 12 點）

export const registerSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
})

export const loginSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.passwordRequired'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.currentPasswordRequired'),
    newPassword: z.string().min(8, 'validation.newPasswordMin8'),
    confirmPassword: z.string().min(1, 'validation.confirmPasswordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'validation.newPasswordSameAsCurrent',
    path: ['newPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8, 'validation.newPasswordMin8'),
    confirmPassword: z.string().min(1, 'validation.confirmPasswordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  })
