/*
 * ----------------------------------------------
 * 日期顯示工具（Asia/Taipei）
 * 2026-10-22
 * lib/utils/date.ts
 *
 * 事工在台灣，日期一律以 Asia/Taipei 民用日顯示；若改用
 * `date.getFullYear()`/`getDate()` 等本地時區 getter，server（通常 UTC）
 * 與瀏覽器（通常 UTC+8）會在跨日時段算出不同日期，導致 Client Component
 * SSR／hydration 結果不一致（React hydration mismatch）。
 * ----------------------------------------------
 */

const DISPLAY_TZ = 'Asia/Taipei'

/** 某 UTC 瞬間在 Asia/Taipei 的日期字串（YYYY/MM/DD），不受執行環境本地時區影響 */
export function formatDateTW(date: Date): string {
  // en-CA 產出 YYYY-MM-DD，取代為 /
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/-/g, '/')
}
