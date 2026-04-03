/*
 * ----------------------------------------------
 * 後台開課管理頁
 * 2026-04-03
 * app/(user)/admin/course-sessions/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { getAllCourseSessionsAdmin } from '@/lib/data/course-sessions'
import { getAllCourses } from '@/lib/data/course-catalog'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { CourseSessionsFilter } from './course-sessions-filter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '開課管理 — 啟動事工',
}

const LIMIT = 30

export default async function AdminCourseSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    catalogId?: string
    status?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const role = session.user.role
  if (role !== 'admin' && role !== 'superadmin') redirect('/')

  const { q, catalogId, status, startDate, endDate } = await searchParams

  const validStatus = ['recruiting', 'started', 'completed', 'cancelled'].includes(status ?? '')
    ? (status as 'recruiting' | 'started' | 'completed' | 'cancelled')
    : undefined

  const [{ total, items }, catalogs] = await Promise.all([
    getAllCourseSessionsAdmin({
      q: q || undefined,
      catalogId: catalogId ? Number(catalogId) : undefined,
      status: validStatus,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    getAllCourses(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">開課管理</h1>
        <span className="text-sm text-muted-foreground">共 {total} 筆</span>
      </div>

      {/* 篩選列 */}
      <Suspense>
        <CourseSessionsFilter
          catalogs={catalogs.map((c) => ({ id: c.id, label: c.label }))}
          defaultQ={q ?? ''}
          defaultCatalogId={catalogId ?? ''}
          defaultStatus={status ?? ''}
          defaultStartDate={startDate ?? ''}
          defaultEndDate={endDate ?? ''}
        />
      </Suspense>

      {/* 開課列表 */}
      {items.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          找不到符合條件的開課記錄
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CourseSessionCard
                key={item.id}
                title={item.title}
                courseCatalogId={item.courseCatalogId}
                courseCatalogLabel={item.courseCatalogLabel}
                courseDate={item.courseDate}
                maxCount={item.maxCount}
                enrolledCount={item.enrolledCount}
                expiredAt={item.expiredAt}
                startedAt={item.startedAt}
                cancelledAt={item.cancelledAt}
                completedAt={item.completedAt}
                variant="full"
                href={`/course/${item.id}`}
                newTab
              />
            ))}
          </div>

          {total > LIMIT && (
            <p className="text-center text-sm text-muted-foreground">
              顯示前 {LIMIT} 筆，請使用搜尋縮小範圍
            </p>
          )}
        </>
      )}
    </div>
  )
}
