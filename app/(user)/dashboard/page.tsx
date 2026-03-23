/*
 * ----------------------------------------------
 * Dashboard 首頁
 * 2026-03-23 (Updated: 2026-03-23)
 * app/(user)/dashboard/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { IconUsers, IconUserPlus, IconSparkles } from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import { getMyOrders } from '@/app/actions/course-invite'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentMembers } from '@/components/dashboard/recent-members'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'

export const metadata: Metadata = {
  title: '首頁 — 啟動靈人系統',
}

export default async function DashboardPage() {
  // 統計資料查詢
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalMembers, newThisMonth, withSpiritId, recentMembers, orders] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.user.count({ where: { spiritId: { not: null } } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      getMyOrders(),
    ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">首頁</h1>
        <Suspense>
          <DashboardActions orders={orders} />
        </Suspense>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          icon={<IconUsers className="h-6 w-6" />}
          value={totalMembers}
          title="會員總數"
        />
        <StatsCard
          icon={<IconUserPlus className="h-6 w-6" />}
          value={newThisMonth}
          title="本月新增會員"
        />
        <StatsCard
          icon={<IconSparkles className="h-6 w-6" />}
          value={withSpiritId}
          title="已核發 Spirit ID"
        />
      </div>

      {/* 近期活動 */}
      <RecentMembers members={recentMembers} />
    </div>
  )
}
