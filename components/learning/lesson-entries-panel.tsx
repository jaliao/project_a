/*
 * ----------------------------------------------
 * LessonEntriesPanel - 單一課次的三個經文項目（一格一筆）
 * 2026-08-28
 * components/learning/lesson-entries-panel.tsx
 *
 * 由書籍子頁的課次卡片牆展開（accordion）時渲染於 grid 下方。
 * 每個經文項目一格：已有筆記顯示檢視卡（可切編輯），尚無筆記直接顯示建立表單。
 * 版面比照「聯繫管理者」卡片網格（窄螢幕單欄、sm 以上三欄）。
 * ----------------------------------------------
 */

'use client'

import { useTranslations } from 'next-intl'
import type { LearningStudyEntry } from '@prisma/client'
import type { LessonOutline } from '@/config/learning-outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudyEntryForm } from './study-entry-form'
import { StudyEntryCard } from './study-entry-card'

type Props = {
  courseCatalogId: number
  lesson: LessonOutline
  /** key = `${lessonKey}::${scriptureKey}` */
  entriesBySlot: Record<string, LearningStudyEntry[]>
}

export function LessonEntriesPanel({ courseCatalogId, lesson, entriesBySlot }: Props) {
  const t = useTranslations('learning')

  if (lesson.scriptures.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noScripture')}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {lesson.scriptures.map((scripture) => {
        const slot = `${lesson.key}::${scripture.key}`
        // 一格一筆：只取建立時間最早的那一筆（getStudyEntriesForUser 已 createdAt asc）
        const entry = (entriesBySlot[slot] ?? [])[0] ?? null
        return (
          <Card key={scripture.key} className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">{scripture.label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {entry ? (
                <StudyEntryCard entry={entry} />
              ) : (
                <StudyEntryForm
                  mode="create"
                  courseCatalogId={courseCatalogId}
                  lessonKey={lesson.key}
                  scriptureKey={scripture.key}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
