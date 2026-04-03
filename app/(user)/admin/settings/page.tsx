/*
 * ----------------------------------------------
 * 後台系統設定頁
 * 2026-04-02 (Updated: 2026-04-03)
 * app/(user)/admin/settings/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAdminSetting } from '@/lib/data/admin-settings'
import { getAllChurches, getChurchMemberCount } from '@/lib/data/churches'
import { SettingsTabs } from './settings-tabs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '系統設定 — 啟動事工',
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const role = session.user.role
  if (role !== 'admin' && role !== 'superadmin') redirect('/')

  const { tab } = await searchParams
  const activeTab = tab === 'churches' ? 'churches' : 'basic'

  const [depthStr, churches] = await Promise.all([
    getAdminSetting('hierarchy_depth', '3'),
    getAllChurches(),
  ])
  const currentDepth = Math.min(10, Math.max(1, parseInt(depthStr, 10) || 3))
  const churchesWithCount = await Promise.all(
    churches.map(async (c) => ({
      ...c,
      memberCount: await getChurchMemberCount(c.id),
    }))
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">系統設定</h1>
      <SettingsTabs
        activeTab={activeTab}
        role={role}
        currentDepth={currentDepth}
        churches={churchesWithCount}
      />
    </div>
  )
}
