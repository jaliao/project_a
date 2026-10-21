/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 認證相關
 * 2026-03-23
 * lib/schemas/auth.ts
 * ----------------------------------------------
 */

import { z } from 'zod'
import { basicProfileShape, applyChurchRefine } from '@/lib/schemas/profile'

// 驗證訊息為 i18n key（validation.* 命名空間），由呈現端 t() 翻譯（見 CLAUDE.md 第 12 點）

// 註冊需與基本資料（姓名/手機/性別/出生年/所屬教會）同一次驗證通過才算成立帳號，
// 欄位定義與 onboarding Step 2 共用（lib/schemas/profile.ts 的 basicProfileShape）
export const registerSchema = z
  .object({
    email: z.string().email('validation.emailInvalid'),
    ...basicProfileShape,
  })
  .superRefine(applyChurchRefine)

// 登入識別可為 Email 或帳號代碼，格式交由後端 Credentials authorize() 查詢判斷，
// 此處僅要求非空（不強制 email 格式，因為帳號代碼不是 email）
export const loginSchema = z.object({
  identifier: z.string().min(1, 'validation.identifierRequired'),
  password: z.string().min(1, 'validation.passwordRequired'),
})

// 帳號代碼格式（cr-feat-261021-004）：4–20 字元，首尾英數字，中間可含 . _ -，不可連續或以符號開頭結尾
export const loginHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{2,18}[a-z0-9]$/, 'validation.loginHandleInvalid')

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

// 全新 LINE 使用者 onboarding「設定登入密碼（選填）」步驟：僅新增密碼，無目前密碼可比對
export const setInitialPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'validation.newPasswordMin8'),
    confirmPassword: z.string().min(1, 'validation.confirmPasswordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
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
