/*
 * ----------------------------------------------
 * 課程目錄管理（redirect）
 * 2026-04-03
 * app/(user)/admin/course-catalog/page.tsx
 *
 * 已整合至系統設定 Tabs，此頁保留相容舊連結
 * ----------------------------------------------
 */

import { redirect } from 'next/navigation'

export default function AdminCourseCatalogPage() {
  redirect('/admin/settings?tab=courses')
}
