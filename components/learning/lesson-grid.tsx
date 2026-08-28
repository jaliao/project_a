/*
 * ----------------------------------------------
 * LessonGrid - 單一課程目錄的課次卡片牆（accordion 展開筆記）
 * 2026-08-28
 * components/learning/lesson-grid.tsx
 * ----------------------------------------------
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconChevronDown } from '@tabler/icons-react'
import type { LearningStudyEntry } from '@prisma/client'
import type { CatalogOutline, LessonOutline } from '@/config/learning-outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CourseCardGrid } from '@/components/course-session/course-card-grid'
import { LessonEntriesPanel } from './lesson-entries-panel'

type LessonState = 'done' | 'todo' | 'noScripture'

function lessonState(lesson: LessonOutline, lessonKeysWithEntries: Set<string>): LessonState {
  if (lesson.scriptures.length === 0) return 'noScripture'
  return lessonKeysWithEntries.has(lesson.key) ? 'done' : 'todo'
}

type Props = {
  outline: CatalogOutline
  /** key = `${lessonKey}::${scriptureKey}` */
  entriesBySlot: Record<string, LearningStudyEntry[]>
  /** 已有至少一筆筆記的 lessonKey */
  lessonKeysWithEntries: string[]
}

export function LessonGrid({ outline, entriesBySlot, lessonKeysWithEntries }: Props) {
  const t = useTranslations('learning')
  const withEntries = new Set(lessonKeysWithEntries)
  const [openKey, setOpenKey] = useState<string | null>(null)

  const lessons = [...outline.lessons].sort((a, b) => a.order - b.order)
  const openLesson = lessons.find((l) => l.key === openKey) ?? null

  return (
    <div className="space-y-4">
      <CourseCardGrid>
        {lessons.map((lesson) => {
          const state = lessonState(lesson, withEntries)
          const isOpen = openKey === lesson.key
          return (
            <button
              key={lesson.key}
              type="button"
              onClick={() => setOpenKey(isOpen ? null : lesson.key)}
              aria-expanded={isOpen}
              className={cn(
                'flex h-full flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50',
                state === 'done' && 'border-green-500/60',
                state === 'noScripture' && 'border-green-500/60',
                state === 'todo' && 'border-dashed border-amber-400',
                isOpen && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">{lesson.title}</span>
                <IconChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              </div>
              {state === 'done' && (
                <Badge className="bg-green-600 text-white">{t('lessonDone')}</Badge>
              )}
              {state === 'noScripture' && (
                <Badge variant="secondary">{t('lessonNoScripture')}</Badge>
              )}
              {state === 'todo' && (
                <Badge className="bg-amber-500 text-white">{t('lessonTodo')}</Badge>
              )}
            </button>
          )
        })}
      </CourseCardGrid>

      {openLesson && (
        <section className="space-y-4 rounded-lg border p-5">
          <h3 className="text-base font-semibold">{openLesson.title}</h3>
          <LessonEntriesPanel
            courseCatalogId={outline.courseCatalogId}
            lesson={openLesson}
            entriesBySlot={entriesBySlot}
          />
        </section>
      )}
    </div>
  )
}
