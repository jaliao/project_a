/*
 * ----------------------------------------------
 * 開課查詢頁
 * 2026-03-24
 * app/(user)/course-sessions/page.tsx
 * ----------------------------------------------
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconArrowLeft, IconChalkboard } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { getMyCourseSessions } from '@/lib/data/course-sessions'
import { CourseSessionCard } from '@/components/course-session/course-session-card'

export const metadata: Metadata = {
  title: '開課查詢 — 啟動事工',
}

export default async function CourseSessionsPage() {
  const session = await auth()
  const sessions = session?.user?.id
    ? await getMyCourseSessions(session.user.id)
    : []

  return (
    <div className="space-y-6">
      {/* 頁首 */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="h-4 w-4" />
          返回首頁
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <IconChalkboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">開課查詢</h1>
      </div>

      {/* 開課列表 */}
      {sessions.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
          尚無開課記錄
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((item) => (
            <CourseSessionCard
              key={item.id}
              title={item.title}
              courseCatalogId={item.courseCatalogId}
              courseCatalogLabel={item.courseCatalogLabel}
              courseDate={item.courseDate}
              maxCount={item.maxCount}
              enrolledCount={item.enrolledCount}
              expiredAt={item.expiredAt}
              variant="full"
              href={`/course/${item.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
