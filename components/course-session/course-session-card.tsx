/*
 * ----------------------------------------------
 * CourseSessionCard - 開課卡片共用元件
 * 2026-03-24 (Updated: 2026-03-30)
 * components/course-session/course-session-card.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import { IconCalendar, IconUsers, IconClock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { CourseStatusBadge, getCourseStatus } from '@/components/course-session/course-status-badge'
import { CourseCatalogBadge } from '@/components/course-session/course-catalog-badge'

type CourseSessionCardProps = {
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
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function CourseSessionCard({
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
}: CourseSessionCardProps) {
  const status = getCourseStatus({ cancelledAt, completedAt, startedAt })
  const progressRatio = maxCount > 0 ? Math.min(enrolledCount / maxCount, 1) : 0

  const card = (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3',
        variant === 'full' && 'p-5',
        href && 'cursor-pointer transition-shadow hover:shadow-md'
      )}
    >
      {/* 標題、等級、狀態 */}
      <div className="flex items-start justify-between gap-2">
        <p className={cn('font-semibold text-sm', variant === 'full' && 'text-base')}>
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <CourseCatalogBadge catalogId={courseCatalogId} label={courseCatalogLabel} size="sm" />
          {status && <CourseStatusBadge status={status} size="sm" />}
        </div>
      </div>

      {/* 資訊列 */}
      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {/* 人數 + 進度 bar */}
        <div className="flex items-center gap-1.5">
          <IconUsers className="h-3.5 w-3.5 shrink-0" />
          <span>
            已報名 {enrolledCount} / 預計 {maxCount} 人
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
            <span>預計開課：{courseDate}</span>
          </div>
        )}

        {/* 截止日期 */}
        {expiredAt && (
          <div className="flex items-center gap-1.5">
            <IconClock className="h-3.5 w-3.5 shrink-0" />
            <span>截止報名：{formatDate(expiredAt)}</span>
          </div>
        )}
      </div>
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
