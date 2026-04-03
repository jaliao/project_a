/*
 * ----------------------------------------------
 * 後台儀錶板頁面
 * 2026-04-03
 * app/(user)/admin/dashboard/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  getDashboardStats,
  getCourseStartStats,
  getGraduationStats,
} from '@/lib/data/dashboard'
import { DashboardCharts } from './dashboard-charts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '儀錶板 — 啟動事工',
}

type Range = '3m' | '30d' | '7d'

const RANGE_DAYS: Record<Range, number> = {
  '3m': 90,
  '30d': 30,
  '7d': 7,
}

const RANGE_LABELS: Record<Range, string> = {
  '3m': '3個月內',
  '30d': '30天內',
  '7d': '7天內',
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-5 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const role = session.user.role
  if (role !== 'admin' && role !== 'superadmin') redirect('/')

  const { range: rawRange } = await searchParams
  const range: Range = rawRange === '3m' || rawRange === '7d' ? rawRange : '30d'
  const days = RANGE_DAYS[range]

  const [stats, startStats, graduationStats] = await Promise.all([
    getDashboardStats(),
    getCourseStartStats(days),
    getGraduationStats(days),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">儀錶板</h1>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="總學員數" value={stats.totalMembers} />
        <StatCard label="啟動靈人資格講師數" value={stats.spiritInstructors} />
        <StatCard label="啟動豐盛資格講師數" value={stats.richInstructors} />
        <StatCard label="進行中課程總數" value={stats.activeCourseSessions} />
      </div>

      {/* 圖表標題 + 時間區間說明 */}
      <div>
        <h2 className="text-lg font-medium">課程活動統計</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          目前顯示：{RANGE_LABELS[range]}
        </p>
      </div>

      {/* 圖表 */}
      <DashboardCharts
        startStats={startStats}
        graduationStats={graduationStats}
        range={range}
      />
    </div>
  )
}
