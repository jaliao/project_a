/*
 * ----------------------------------------------
 * 後台儀錶板頁面
 * 2026-04-03 (Updated: 2026-06-11)
 * app/(user)/admin/dashboard/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { canAccessAdmin } from '@/lib/auth-roles'
import { getDashboardStats } from '@/lib/data/dashboard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '儀錶板 — 啟動事工',
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-5 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!canAccessAdmin(session.user.roles)) redirect('/')

  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">儀錶板</h1>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="總會員數" value={stats.totalMembers} />
        <StatCard label="啟動靈人講師資格人數" value={stats.spiritInstructors} />
        <StatCard label="啟動豐盛講師資格人數" value={stats.richInstructors} />
        <StatCard label="啟動得勝講師資格人數" value={stats.victoryInstructors} />
        <StatCard label="開課中課程總數" value={stats.recruitingCourseSessions} />
        <StatCard label="進行中課程總數" value={stats.activeCourseSessions} />
        <StatCard label="已結業課程總數" value={stats.completedCourseSessions} />
      </div>
    </div>
  )
}
