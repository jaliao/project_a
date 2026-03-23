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
import Link from 'next/link'
import { IconUsers, IconUserPlus, IconSparkles, IconBook } from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getMyOrders } from '@/app/actions/course-invite'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentMembers } from '@/components/dashboard/recent-members'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'
import { ProfileBanner } from '@/components/dashboard/profile-banner'
import { CourseSessionDialog } from '@/components/course-session/course-session-dialog'
import { EnrolledStudentsList } from '@/components/course-session/enrolled-students-list'

export const metadata: Metadata = {
  title: '首頁 — 啟動靈人系統',
}

export default async function DashboardPage() {
  const session = await auth()

  // 統計資料查詢
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalMembers, newThisMonth, withSpiritId, recentMembers, orders, currentUser] =
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
      session?.user?.id
        ? prisma.user.findUnique({
            where: { id: session.user.id },
            select: { realName: true, name: true, email: true, commEmail: true, phone: true },
          })
        : null,
    ])

  const effectiveCommEmail = currentUser?.commEmail ?? currentUser?.email
  const isProfileComplete = !!(
    currentUser?.realName &&
    effectiveCommEmail &&
    currentUser?.phone
  )
  const displayName = currentUser?.realName || currentUser?.name || null

  return (
    <div className="space-y-6">
      {/* 資料完整度 Banner / 歡迎訊息 */}
      <ProfileBanner isComplete={isProfileComplete} displayName={displayName} />

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

      {/* 快速連結 */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/learning"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <IconBook className="h-4 w-4" />
          學習紀錄
        </Link>
      </div>

      {/* 新增開課 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">開課管理</h2>
          <CourseSessionDialog />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-3">已接受邀請的學員</p>
          <Suspense fallback={<p className="text-sm text-muted-foreground">載入中…</p>}>
            <EnrolledStudentsList />
          </Suspense>
        </div>
      </div>

      {/* 近期活動 */}
      <RecentMembers members={recentMembers} />
    </div>
  )
}
