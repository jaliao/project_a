/*
 * ----------------------------------------------
 * MatchBoardTabs - 媒合布告欄頁籤（找課程／找學員）
 * 2026-09-14
 * components/match-board/match-board-tabs.tsx
 *
 * cr-spec-260914-001：原單一列表頁改為頁籤結構；「找課程」沿用既有公開
 * 招募課程列表，「找學員」列出刊登中上課意願的學員（StudentMatchingList）。
 * 頁籤同步 ?tab= query，比照 components/conversation/messages-page.tsx 的作法。
 * ----------------------------------------------
 */

'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CourseCardGrid } from '@/components/course-session/course-card-grid'
import { CourseSessionCard } from '@/components/course-session/course-session-card'
import { StudentMatchingList } from '@/components/match-board/student-matching-list'
import type { MatchBoardItem } from '@/lib/data/course-sessions'
import type { MatchableStudent } from '@/lib/data/learning-intent'

type MatchBoardTab = 'courses' | 'students'

type Props = {
  courseItems: MatchBoardItem[]
  students: MatchableStudent[]
  initialTab: MatchBoardTab
}

export function MatchBoardTabs({ courseItems, students, initialTab }: Props) {
  const router = useRouter()
  const t = useTranslations('matchBoard')
  const [tab, setTab] = useState<MatchBoardTab>(initialTab)

  const changeTab = useCallback(
    (next: string) => {
      const value: MatchBoardTab = next === 'students' ? 'students' : 'courses'
      setTab(value)
      router.replace(`/match-board?tab=${value}`, { scroll: false })
    },
    [router]
  )

  return (
    <Tabs value={tab} onValueChange={changeTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="courses">{t('tabCourses')}</TabsTrigger>
        <TabsTrigger value="students">{t('tabStudents')}</TabsTrigger>
      </TabsList>

      <TabsContent value="courses">
        {courseItems.length === 0 ? (
          <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {t('empty')}
          </p>
        ) : (
          <CourseCardGrid>
            {courseItems.map((item) => (
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
      </TabsContent>

      <TabsContent value="students">
        <StudentMatchingList students={students} />
      </TabsContent>
    </Tabs>
  )
}
