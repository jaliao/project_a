/*
 * ----------------------------------------------
 * CourseSessionCard - 開課卡片共用元件
 * 2026-03-24 (Updated: 2026-03-30)
 * components/course-session/course-session-card.tsx
 * ----------------------------------------------
 */

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { IconCalendar, IconUsers, IconClock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { CourseStatusBadge } from '@/components/course-session/course-status-badge'
import { getCourseStatus } from '@/components/course-session/course-status'
import { CourseCatalogBadge } from '@/components/course-session/course-catalog-badge'
import { Badge } from '@/components/ui/badge'

type CourseSessionCardProps = {
  inviteId: number // 課程編號（所有使用處一律顯示 #編號）
  title: string
  courseCatalogId: number
  courseCatalogLabel: string
  courseDate: string | null
  maxCount: number
  enrolledCount: number
  expiredAt: Date | null
  variant?: 'compact' | 'full'
  href?: string
  newTab?: boolean
  startedAt?: Date | null
  cancelledAt?: Date | null
  completedAt?: Date | null
  archivedAt?: Date | null
  matchNote?: string | null
  showMatchBadge?: boolean
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function CourseSessionCard({
  inviteId,
  title,
  courseCatalogId,
  courseCatalogLabel,
  courseDate,
  maxCount,
  enrolledCount,
  expiredAt,
  variant = 'compact',
  href,
  newTab = false,
  startedAt,
  cancelledAt,
  completedAt,
  archivedAt,
  matchNote,
  showMatchBadge = false,
}: CourseSessionCardProps) {
  const status = getCourseStatus({ cancelledAt, completedAt, startedAt })
  const t = useTranslations('course.card')
  const progressRatio = maxCount > 0 ? Math.min(enrolledCount / maxCount, 1) : 0

  const card = (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3',
        variant === 'full' && 'p-5',
        href && 'cursor-pointer transition-shadow hover:shadow-md'
      )}
    >
      {/* 標籤列（標題上方）、標題獨占一行不折行擠壓 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">#{inviteId}</span>
          {showMatchBadge && (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-xs">{t('publicRecruiting')}</Badge>
          )}
          <CourseCatalogBadge catalogId={courseCatalogId} label={courseCatalogLabel} size="sm" />
          {status && <CourseStatusBadge status={status} size="sm" />}
          {archivedAt && (
            <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 text-xs">{t('archived')}</Badge>
          )}
        </div>
        <p className={cn('font-semibold text-sm', variant === 'full' && 'text-base')}>
          {title}
        </p>
      </div>

      {/* 資訊列 */}
      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {/* 人數 + 進度 bar */}
        <div className="flex items-center gap-1.5">
          <IconUsers className="h-3.5 w-3.5 shrink-0" />
          <span>
            {t('enrolledPlanned', { enrolled: enrolledCount, max: maxCount })}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              status === 'completed' ? 'bg-gray-400' :
                status === 'cancelled' ? 'bg-red-400' :
                  status === 'active' ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>

        {/* 開課日期 */}
        {courseDate && (
          <div className="flex items-center gap-1.5">
            <IconCalendar className="h-3.5 w-3.5 shrink-0" />
            <span>{t('expectedStart', { date: courseDate })}</span>
          </div>
        )}

        {/* 截止日期 */}
        {expiredAt && (
          <div className="flex items-center gap-1.5">
            <IconClock className="h-3.5 w-3.5 shrink-0" />
            <span>{t('deadline', { date: formatDate(expiredAt) })}</span>
          </div>
        )}
      </div>

      {/* 公開招募備註 */}
      {matchNote && (
        <p className="whitespace-pre-wrap rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
          {matchNote}
        </p>
      )}
    </div>
  )

  if (href) {
    if (newTab) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {card}
        </a>
      )
    }
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
