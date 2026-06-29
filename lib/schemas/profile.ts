/*
 * ----------------------------------------------
 * Zod 驗證 Schema - 個人資料相關
 * 2026-03-23
 * lib/schemas/profile.ts
 * ----------------------------------------------
 */

import { z } from 'zod'

// 出生年合理區間：西元 1900 ~ 當年
const BIRTH_YEAR_MIN = 1900
const currentYear = () => new Date().getFullYear()

// 出生年欄位（可空）：空字串/null/undefined → null；否則需為合理西元年整數
const birthYearOptional = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z
    .number({ message: '請輸入有效的出生年（西元）' })
    .int('出生年需為整數')
    .min(BIRTH_YEAR_MIN, `出生年不可早於 ${BIRTH_YEAR_MIN}`)
    .max(currentYear(), `出生年不可超過 ${currentYear()}`)
    .nullable()
)

export const updateProfileSchema = z
  .object({
    realName: z.string().min(1, '真實姓名為必填'),
    nickname: z.string().max(20, '暱稱不可超過 20 個字').optional(),
    phone: z
      .string()
      .regex(/^(09\d{8}|\+8869\d{8})$/, '請輸入有效的台灣手機號碼（09xxxxxxxx 或 +886xxxxxxxxx）')
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
      ctx.addIssue({ code: 'custom', path: ['churchId'], message: '請選擇教會' })
    }
    if (data.churchType === 'other' && !data.churchOther?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['churchOther'], message: '請填寫教會/單位名稱' })
    }
  })

// 首次登入（onboarding）Step 2：性別、出生年、所屬教會皆必填
export const onboardingProfileSchema = z
  .object({
    realName: z.string().trim().min(1, '請輸入真實姓名'),
    phone: z
      .string()
      .trim()
      .regex(/^(09\d{8}|\+8869\d{8})$/, '請輸入有效的台灣手機號碼（09xxxxxxxx 或 +886xxxxxxxxx）'),
    // 性別必填：須為男/女，不接受未指定
    gender: z.enum(['male', 'female'], { message: '請選擇性別' }),
    // 出生年必填：合理西元年整數
    birthYear: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z
        .number({ message: '請輸入出生年（西元）' })
        .int('出生年需為整數')
        .min(BIRTH_YEAR_MIN, `出生年不可早於 ${BIRTH_YEAR_MIN}`)
        .max(currentYear(), `出生年不可超過 ${currentYear()}`)
    ),
    // 所屬教會必填：清單教會或其他，不接受「無」
    churchType: z.enum(['church', 'other'], { message: '請選擇所屬教會/單位' }),
    churchId: z.number().int().positive().optional().nullable(),
    churchOther: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.churchType === 'church' && !data.churchId) {
      ctx.addIssue({ code: 'custom', path: ['churchId'], message: '請選擇教會' })
    }
    if (data.churchType === 'other' && !data.churchOther?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['churchOther'], message: '請填寫教會/單位名稱' })
    }
  })

export const commEmailSchema = z.object({
  commEmail: z.string().email('請輸入有效的 Email 格式'),
})
