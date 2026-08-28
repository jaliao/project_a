/*
 * ----------------------------------------------
 * LearningOutlineSection - 單一課程目錄的大綱與筆記
 * 2026-08-28
 * components/learning/learning-outline-section.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconPlus } from '@tabler/icons-react'
import type { LearningStudyEntry } from '@prisma/client'
import type { CatalogOutline } from '@/config/learning-outline'
import { Button } from '@/components/ui/button'
import { StudyEntryForm } from './study-entry-form'
import { StudyEntryCard } from './study-entry-card'

type Props = {
  catalogLabel: string
  outline: CatalogOutline
  /** key = `${lessonKey}::${scriptureKey}` */
  entriesBySlot: Record<string, LearningStudyEntry[]>
  /** 大綱已找不到對應課次／經文的筆記 */
  orphanEntries: LearningStudyEntry[]
}

export function LearningOutlineSection({
  catalogLabel,
  outline,
  entriesBySlot,
  orphanEntries,
}: Props) {
  const t = useTranslations('learning')
  // 目前開啟「新增表單」的槽：`${lessonKey}::${scriptureKey}`
  const [openSlot, setOpenSlot] = useState<string | null>(null)

  const lessons = [...outline.lessons].sort((a, b) => a.order - b.order)

  return (
    <section className="space-y-5 rounded-lg border p-5">
      <h2 className="text-lg font-semibold">{catalogLabel}</h2>

      {lessons.map((lesson) => (
        <div key={lesson.key} className="space-y-4">
          <h3 className="text-base font-medium">{lesson.title}</h3>

          {lesson.scriptures.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noScripture')}</p>
          ) : (
            lesson.scriptures.map((scripture) => {
              const slot = `${lesson.key}::${scripture.key}`
              const entries = entriesBySlot[slot] ?? []
              return (
                <div key={scripture.key} className="space-y-3 border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{scripture.label}</p>
                    {openSlot !== slot && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenSlot(slot)}
                      >
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
                      courseCatalogId={outline.courseCatalogId}
                      lessonKey={lesson.key}
                      scriptureKey={scripture.key}
                      onDone={() => setOpenSlot(null)}
                      onCancel={() => setOpenSlot(null)}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      ))}

      {orphanEntries.length > 0 && (
        <div className="space-y-3 rounded-md bg-muted/30 p-4">
          <h3 className="text-base font-medium">{t('orphanSectionTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('orphanSectionHint')}</p>
          {orphanEntries.map((entry) => (
            <StudyEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  )
}
