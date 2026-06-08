/*
 * ----------------------------------------------
 * 媒合布告欄頁面
 * 2026-06-06
 * app/(user)/match-board/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getPublicMatchingSessions } from '@/lib/data/course-sessions'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { CourseCardGrid } from '@/components/course-session/course-card-grid'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '媒合布告欄 — 啟動事工',
}

export default async function MatchBoardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const items = await getPublicMatchingSessions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">媒合布告欄</h1>
        <p className="text-sm text-muted-foreground mt-1">
          以下為公開招募中的課程，點擊卡片可前往課程頁報名。
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          目前沒有公開招募中的課程
        </p>
      ) : (
        <CourseCardGrid>
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
              matchNote={item.matchNote}
              showMatchBadge
              href={`/course/${item.id}`}
            />
          ))}
        </CourseCardGrid>
      )}
    </div>
  )
}
