/*
 * ----------------------------------------------
 * LessonEntriesPanel - 單一課次的經文項目與分段查經筆記
 * 2026-08-28
 * components/learning/lesson-entries-panel.tsx
 *
 * 由書籍子頁的課次卡片牆展開（accordion）時渲染於 grid 下方。
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconPlus } from '@tabler/icons-react'
import type { LearningStudyEntry } from '@prisma/client'
import type { LessonOutline } from '@/config/learning-outline'
import { Button } from '@/components/ui/button'
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
  // 目前開啟「新增表單」的槽：`${lessonKey}::${scriptureKey}`
  const [openSlot, setOpenSlot] = useState<string | null>(null)

  if (lesson.scriptures.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noScripture')}</p>
  }

  return (
    <div className="space-y-4">
      {lesson.scriptures.map((scripture) => {
        const slot = `${lesson.key}::${scripture.key}`
        const entries = entriesBySlot[slot] ?? []
        return (
          <div key={scripture.key} className="space-y-3 border-l-2 border-muted pl-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{scripture.label}</p>
              {openSlot !== slot && (
                <Button type="button" size="sm" variant="outline" onClick={() => setOpenSlot(slot)}>
                  <IconPlus className="mr-1 h-4 w-4" />
                  {t('addEntry')}
                </Button>
              )}
            </div>

            {entries.length === 0 && openSlot !== slot && (
              <p className="text-sm text-muted-foreground">{t('noEntries')}</p>
            )}

            {entries.map((entry) => (
              <StudyEntryCard key={entry.id} entry={entry} />
            ))}

            {openSlot === slot && (
              <StudyEntryForm
                mode="create"
                courseCatalogId={courseCatalogId}
                lessonKey={lesson.key}
                scriptureKey={scripture.key}
                onDone={() => setOpenSlot(null)}
                onCancel={() => setOpenSlot(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
