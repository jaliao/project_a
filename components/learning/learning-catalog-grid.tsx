/*
 * ----------------------------------------------
 * LearningCatalogGrid - 我的學習：書籍（課程目錄）卡片牆
 * 2026-08-28
 * components/learning/learning-catalog-grid.tsx
 * ----------------------------------------------
 */

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { IconLock, IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { CourseCardGrid } from '@/components/course-session/course-card-grid'

export type LearningCatalogCard = {
  id: number
  label: string
  canEnter: boolean
  /** 'locked'（尚未開課）｜'comingSoon'（尚無大綱） */
  lockReason?: 'locked' | 'comingSoon'
  doneCount?: number
  totalCount?: number
}

type Props = {
  spiritId: string
  catalogs: LearningCatalogCard[]
}

export function LearningCatalogGrid({ spiritId, catalogs }: Props) {
  const t = useTranslations('learning')

  return (
    <CourseCardGrid>
      {catalogs.map((c) => {
        if (c.canEnter) {
          return (
            <Link
              key={c.id}
              href={`/user/${spiritId}/learning/${c.id}`}
              className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{c.label}</span>
                <IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              {typeof c.doneCount === 'number' && typeof c.totalCount === 'number' && (
                <span className="text-xs text-muted-foreground">
                  {t('progressCount', { done: c.doneCount, total: c.totalCount })}
                </span>
              )}
            </Link>
          )
        }
        return (
          <div
            key={c.id}
            aria-disabled
            title={t(c.lockReason === 'comingSoon' ? 'catalogComingSoon' : 'catalogLocked')}
            className={cn(
              'flex h-full cursor-not-allowed flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-4 text-muted-foreground'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold">{c.label}</span>
              <IconLock className="h-4 w-4 shrink-0" />
            </div>
            <span className="text-xs">
              {t(c.lockReason === 'comingSoon' ? 'catalogComingSoon' : 'catalogLocked')}
            </span>
          </div>
        )
      })}
    </CourseCardGrid>
  )
}
