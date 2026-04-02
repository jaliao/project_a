/*
 * ----------------------------------------------
 * 後台系統設定頁
 * 2026-04-02
 * app/(user)/admin/settings/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAdminSetting } from '@/lib/data/admin-settings'
import { HierarchyDepthForm } from '@/components/admin/hierarchy-depth-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '系統設定 — 啟動事工',
}

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'superadmin') redirect('/')

  const depthStr = await getAdminSetting('hierarchy_depth', '3')
  const currentDepth = Math.min(10, Math.max(1, parseInt(depthStr, 10) || 3))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">系統設定</h1>

      <div className="rounded-lg border p-5 space-y-4 max-w-md">
        <div>
          <h2 className="font-medium">學習階層展開深度</h2>
          <p className="text-sm text-muted-foreground mt-1">
            會員詳情頁「學習階層」分頁向下展開的層數（1–10），預設為 3。
          </p>
        </div>
        <HierarchyDepthForm currentDepth={currentDepth} />
      </div>
    </div>
  )
}
