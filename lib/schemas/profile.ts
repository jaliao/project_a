/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 個人資料相關
 * 2026-03-23 (Updated: 2026-07-13)
 * lib/schemas/profile.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 驗證訊息為 i18n key（validation.* 命名空間），由呈現端 t() 翻譯（見 CLAUDE.md 第 12 點）

// 手機號碼：台灣 09 開頭 10 碼，或 E.164 國際格式（+ 開頭、國碼首位 1–9、共 8–15 位數字）
const PHONE_REGEX = /^(09\d{8}|\+[1-9]\d{7,14})$/

// 出生年合理區間：西元 1900 ~ 當年
const BIRTH_YEAR_MIN = 1900
const currentYear = () => new Date().getFullYear()

// 出生年欄位（可空）：空字串/null/undefined → null；否則需為合理西元年整數
const birthYearOptional = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z
    .number({ message: 'validation.birthYearInvalid' })
    .int('validation.birthYearInteger')
    .min(BIRTH_YEAR_MIN, 'validation.birthYearMin')
    .max(currentYear(), 'validation.birthYearMax')
    .nullable()
)

export const updateProfileSchema = z
  .object({
    realName: z.string().min(1, 'validation.realNameRequired'),
    nickname: z.string().max(20, 'validation.nicknameMax20').optional(),
    phone: z
      .string()
      .regex(PHONE_REGEX, 'validation.phoneInvalid')
      .optional()
      .or(z.literal('')),
    address: z.string().optional(),
    // 英文名稱、性別、顯示名稱模式
    englishName: z.string().optional(),
    gender: z.enum(['male', 'female', 'unspecified']),
    birthYear: birthYearOptional,
    displayNameMode: z.enum(['nickname', 'nickname_zh', 'nickname_en']),
    // 所屬教會
    churchType: z.enum(['church', 'other', 'none']),
    churchId: z.number().int().positive().optional().nullable(),
    churchOther: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.churchType === 'church' && !data.churchId) {
      ctx.addIssue({ code: 'custom', path: ['churchId'], message: 'validation.churchSelect' })
    }
    if (data.churchType === 'other' && !data.churchOther?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['churchOther'], message: 'validation.churchOtherRequired' })
    }
  })

// 首次登入（onboarding）Step 2：性別、出生年、所屬教會皆必填
export const onboardingProfileSchema = z
  .object({
    realName: z.string().trim().min(1, 'validation.realNameEnter'),
    phone: z
      .string()
      .trim()
      .regex(PHONE_REGEX, 'validation.phoneInvalid'),
    // 性別必填：須為男/女，不接受未指定
    gender: z.enum(['male', 'female'], { message: 'validation.genderRequired' }),
    // 出生年必填：合理西元年整數
    birthYear: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z
        .number({ message: 'validation.birthYearEnter' })
        .int('validation.birthYearInteger')
        .min(BIRTH_YEAR_MIN, 'validation.birthYearMin')
        .max(currentYear(), 'validation.birthYearMax')
    ),
    // 所屬教會必填：清單教會或其他，不接受「無」
    churchType: z.enum(['church', 'other'], { message: 'validation.churchRequired' }),
    churchId: z.number().int().positive().optional().nullable(),
    churchOther: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.churchType === 'church' && !data.churchId) {
      ctx.addIssue({ code: 'custom', path: ['churchId'], message: 'validation.churchSelect' })
    }
    if (data.churchType === 'other' && !data.churchOther?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['churchOther'], message: 'validation.churchOtherRequired' })
    }
  })

export const commEmailSchema = z.object({
  commEmail: z.string().email('validation.emailInvalid'),
})
