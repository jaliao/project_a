/*
 * ----------------------------------------------
 * 管理後台首頁
 * 2026-03-24
 * app/(user)/admin/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { IconBook } from '@tabler/icons-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getMyOrders } from '@/app/actions/course-invite'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentMembers } from '@/components/dashboard/recent-members'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'
import { EnrolledStudentsList } from '@/components/course-session/enrolled-students-list'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { getMyCourseSessions, getMyCourseSessionCount } from '@/lib/data/course-sessions'
import { getActiveCourses } from '@/lib/data/course-catalog'

export const metadata: Metadata = {
  title: '管理後台 — 啟動靈人系統',
}

export default async function AdminPage() {
  const session = await auth()

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const PREVIEW_LIMIT = 5

  const [totalMembers, newThisMonth, withSpiritId, recentMembers, orders, previewSessions, totalSessionCount, activeCourses] =
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
      session?.user?.id ? getMyCourseSessions(session.user.id, PREVIEW_LIMIT) : [],
      session?.user?.id ? getMyCourseSessionCount(session.user.id) : 0,
      getActiveCourses(),
    ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">管理後台</h1>
        <Suspense>
          <DashboardActions activeCourses={activeCourses} orders={orders} />
        </Suspense>
      </div>

      {/* 管理功能入口 */}
      <div className="flex gap-3">
        <Link
          href="/admin/course-catalog"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <IconBook className="h-4 w-4 text-primary" />
          課程目錄管理
        </Link>
      </div>

      {/* 已新增的開課 */}
      {previewSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">已新增的開課</h2>
            {totalSessionCount > PREVIEW_LIMIT && (
              <Link
                href="/course-sessions"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previewSessions.map((item) => (
              <CourseSessionCard
                key={item.id}
                title={item.title}
                courseCatalogId={item.courseCatalogId}
                courseCatalogLabel={item.courseCatalogLabel}
                courseDate={item.courseDate}
                maxCount={item.maxCount}
                enrolledCount={item.enrolledCount}
                expiredAt={item.expiredAt}
                variant="compact"
                href={`/course/${item.id}`}
              />
            ))}
          </div>
        </div>
      )}

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
