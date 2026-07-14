/*
 * ----------------------------------------------
 * 媒合布告欄頁面
 * 2026-06-06
 * app/(user)/match-board/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { getPublicMatchingSessions } from '@/lib/data/course-sessions'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { CourseCardGrid } from '@/components/course-session/course-card-grid'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'matchBoard' })
  return { title: t('metaTitle') }
}

export default async function MatchBoardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'matchBoard' })
  const items = await getPublicMatchingSessions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('desc')}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <CourseCardGrid>
          {items.map((item) => (
            <CourseSessionCard
              inviteId={item.id}
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
