/*
 * ----------------------------------------------
 * Dashboard 首頁
 * 2026-03-23 (Updated: 2026-03-24, 2026-03-24)
 * app/(user)/dashboard/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconUsers, IconUserPlus, IconSparkles, IconBook, IconSchool, IconChalkboard, IconShieldCheck } from '@tabler/icons-react'
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



      {/* 功能單元 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 學習單元（僅 user 角色可見） */}
        {session?.user?.role !== 'admin' && session?.user?.role !== 'superadmin' && <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <IconSchool className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">學習</h2>
          </div>
          <div className="flex flex-col gap-2">
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
            >
              加入學習
            </button>
            <Link
              href="/learning"
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <IconBook className="h-4 w-4" />
              學習紀錄
            </Link>
          </div>
        </div>}

        {/* 授課單元 */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <IconChalkboard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">授課</h2>
          </div>
          <div className="flex flex-col gap-2">
            <CourseSessionDialog />
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
            >
              開課查詢
            </button>
          </div>
        </div>

        {/* 管理者單元（僅 admin / superadmin 可見） */}
        {(session?.user?.role === 'admin' || session?.user?.role === 'superadmin') && (
          <div className="rounded-lg border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <IconShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">管理者</h2>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                管理後台
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 已接受邀請的學員 */}
      <div className="rounded-lg border p-5 space-y-3">
        <h2 className="text-base font-semibold">已接受邀請的學員</h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">載入中…</p>}>
          <EnrolledStudentsList />
        </Suspense>
      </div>

      {/* 近期活動 */}
      <RecentMembers members={recentMembers} />
    </div>
  )
}
