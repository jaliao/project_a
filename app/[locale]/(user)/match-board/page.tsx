/*
 * ----------------------------------------------
 * 媒合布告欄頁面
 * 2026-06-06 (Updated: 2026-09-14)
 * app/(user)/match-board/page.tsx
 *
 * cr-spec-260914-001：改為頁籤結構（找課程／找學員），原列表內容
 * 移入 MatchBoardTabs 的「找課程」頁籤，新增「找學員」頁籤。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { getPublicMatchingSessions } from '@/lib/data/course-sessions'
import { getMatchableStudents } from '@/lib/data/learning-intent'
import { MatchBoardTabs } from '@/components/match-board/match-board-tabs'

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
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { locale } = await params
  const { tab } = await searchParams
  const t = await getTranslations({ locale, namespace: 'matchBoard' })
  const [courseItems, students] = await Promise.all([
    getPublicMatchingSessions(),
    getMatchableStudents(session.user.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('desc')}
        </p>
      </div>

      <MatchBoardTabs
        courseItems={courseItems}
        students={students}
        initialTab={tab === 'students' ? 'students' : 'courses'}
      />
    </div>
  )
}
