/*
 * ----------------------------------------------
 * 訪客可達路徑判定（未登入也可進入，由頁面自行顯示登入提示）
 * 2026-06-21
 * lib/utils/guest-paths.ts
 *
 * ⚠️ middleware.ts 與 (user)/layout.tsx 共用同一判定，確保兩處放行一致。
 * ----------------------------------------------
 */

// 課程詳情頁：僅數字 id，不含子路徑（如 /course/123/graduate 不符）
export const GUEST_COURSE_PATH = /^\/course\/\d+$/

export function isGuestCoursePath(pathname: string): boolean {
  return GUEST_COURSE_PATH.test(pathname)
}
