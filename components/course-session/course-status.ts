/*
 * ----------------------------------------------
 * 課程狀態型別與推導（server-safe，純邏輯）
 * 2026-06-29
 * components/course-session/course-status.ts
 *
 * 與 course-status-badge.tsx（client 顯示元件）分離：
 * 此檔不含 React/i18n，可於 server component 安全呼叫。
 * ----------------------------------------------
 */

export type CourseStatus = 'recruiting' | 'active' | 'completed' | 'cancelled'

export function getCourseStatus(item: {
  cancelledAt?: Date | null
  completedAt?: Date | null
  startedAt?: Date | null
}): CourseStatus | null {
  if (item.cancelledAt === undefined && item.completedAt === undefined && item.startedAt === undefined) return null
  if (item.cancelledAt) return 'cancelled'
  if (item.completedAt) return 'completed'
  if (item.startedAt) return 'active'
  return 'recruiting'
}
