/*
 * ----------------------------------------------
 * LessonAccordion - 單一課程目錄的課次垂直可收合清單
 * 2026-08-28 (Updated: 2026-08-29)
 * components/learning/lesson-accordion.tsx
 *
 * 課次以垂直清單呈現（手機與桌機一致），點列頭就地展開該課次的三個經文項目；
 * 一次至多展開一個課次。四態：無需填寫／待填寫／填寫中／已完成。
 * 進頁預設展開：localStorage 記住的上次課次 → fallback 第一個未完成課次 → 全收合。
 * ----------------------------------------------
 */

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconChevronDown } from '@tabler/icons-react'
import type { LearningStudyEntry } from '@prisma/client'
import {
  lessonFillState,
  type CatalogOutline,
  type LessonFillState,
} from '@/config/learning-outline'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { LessonEntriesPanel } from './lesson-entries-panel'

type Props = {
  outline: CatalogOutline
  /** key = `${lessonKey}::${scriptureKey}` */
  entriesBySlot: Record<string, LearningStudyEntry[]>
  /** 已有至少一筆筆記的經文位置（`${lessonKey}::${scriptureKey}`） */
  filledSlots: string[]
}

/** 四態徽章：done/noScripture 綠、partial 琥珀實、todo 琥珀 outline */
function LessonStateBadge({ state }: { state: LessonFillState }) {
  const t = useTranslations('learning')
  if (state === 'done') return <Badge className="bg-green-600 text-white">{t('lessonDone')}</Badge>
  if (state === 'noScripture') return <Badge variant="secondary">{t('lessonNoScripture')}</Badge>
  if (state === 'partial') return <Badge className="bg-amber-500 text-white">{t('lessonPartial')}</Badge>
  return (
    <Badge variant="outline" className="border-amber-400 text-amber-600">
      {t('lessonTodo')}
    </Badge>
  )
}

export function LessonAccordion({ outline, entriesBySlot, filledSlots }: Props) {
  const filled = new Set(filledSlots)
  const lessons = [...outline.lessons].sort((a, b) => a.order - b.order)
  const [openKey, setOpenKey] = useState<string | null>(null)

  const lsKey = `learning:lastLesson:${outline.courseCatalogId}`

  // 掛載後決定預設展開（client only；SSR 一律全收合以免 hydration 不一致）
  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(lsKey)
    } catch {
      stored = null
    }
    if (stored && lessons.some((l) => l.key === stored)) {
      setOpenKey(stored)
      return
    }
    // fallback：第一個未完成（待填寫 / 填寫中）
    const firstUndone = lessons.find((l) => {
      const s = lessonFillState(l, filled)
      return s === 'todo' || s === 'partial'
    })
    if (firstUndone) setOpenKey(firstUndone.key)
    // 否則全部 done/noScripture → 維持 null（全收合）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // openKey 變動 → 同步 localStorage
  useEffect(() => {
    try {
      if (openKey) window.localStorage.setItem(lsKey, openKey)
      else window.localStorage.removeItem(lsKey)
    } catch {
      /* 無痕視窗 / 停用 storage：靜默略過 */
    }
  }, [openKey, lsKey])

  return (
    <div className="divide-y overflow-hidden rounded-lg border">
      {lessons.map((lesson) => {
        const state = lessonFillState(lesson, filled)
        const isOpen = openKey === lesson.key
        return (
          <div key={lesson.key}>
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : lesson.key)}
              aria-expanded={isOpen}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                isOpen && 'bg-muted/30'
              )}
            >
              <span className="flex-1 text-sm font-medium">{lesson.title}</span>
              <LessonStateBadge state={state} />
              <IconChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="border-t px-4 py-4">
                <LessonEntriesPanel
                  courseCatalogId={outline.courseCatalogId}
                  lesson={lesson}
                  entriesBySlot={entriesBySlot}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
