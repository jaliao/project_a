/*
 * ----------------------------------------------
 * i18n 請求設定（next-intl）
 * 2026-06-29
 * i18n/request.ts
 *
 * 載入當前 locale 訊息，並以預設語言（zh-TW）作缺 key 回退，
 * 支援漸進遷移（未翻譯字串顯示繁體而非 key／報錯）。
 * ----------------------------------------------
 */

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing, defaultLocale } from './routing'

type Messages = Record<string, unknown>

// 深層合併：以 locale 訊息覆蓋預設訊息，未翻譯的 key 逐層回退至預設（繁體）
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const baseValue = out[key]
    if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)
    ) {
      out[key] = deepMerge(baseValue as Messages, value as Messages)
    } else {
      out[key] = value
    }
  }
  return out
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : defaultLocale

  // 預設語言訊息作為 fallback：非預設語言缺 key 時逐層回退繁體
  const defaultMessages = (await import(`../messages/${defaultLocale}.json`)).default as Messages
  const messages =
    locale === defaultLocale
      ? defaultMessages
      : deepMerge(defaultMessages, (await import(`../messages/${locale}.json`)).default as Messages)

  return { locale, messages }
})
