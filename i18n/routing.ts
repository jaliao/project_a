/*
 * ----------------------------------------------
 * i18n 路由設定（next-intl）
 * 2026-06-29
 * i18n/routing.ts
 *
 * 語言：zh-TW（預設，無前綴）/ en / zh-CN（path-prefix as-needed）。
 * ----------------------------------------------
 */

import { defineRouting } from 'next-intl/routing'

export const locales = ['zh-TW', 'en', 'zh-CN'] as const
export type AppLocale = (typeof locales)[number]
export const defaultLocale: AppLocale = 'zh-TW'

export const routing = defineRouting({
  locales,
  defaultLocale,
  // 預設語言不帶前綴；其他語言帶前綴（/en、/zh-cn）
  localePrefix: 'as-needed',
})
