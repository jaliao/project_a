/*
 * ----------------------------------------------
 * CourseSessionCard - 開課卡片共用元件
 * 2026-03-24
 * components/course-session/course-session-card.tsx
 * ----------------------------------------------
 */

import Link from 'next/link'
import { IconCalendar, IconUsers, IconClock } from '@tabler/icons-react'
import { COURSE_CATALOG, type CourseLevel } from '@/config/course-catalog'
import { cn } from '@/lib/utils'

type CourseStatus = 'recruiting' | 'active' | 'completed' | 'cancelled'

const STATUS_LABELS: Record<CourseStatus, string> = {
  recruiting: '招生中',
  active: '進行中',
  completed: '已結業',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<CourseStatus, string> = {
  recruiting: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

function getCourseStatus(item: {
  cancelledAt?: Date | null
  completedAt?: Date | null
  startedAt?: Date | null
}): CourseStatus | null {
  if (item.cancelledAt === undefined && item.completedAt === undefined && item.startedAt === undefined) return null
  if (item.cancelledAt) return 'cancelled'
  if (item.completedAt) return 'completed'
  if (item.startedAt) return 'active'
  return 'recruiting'
}

type CourseSessionCardProps = {
  title: string
  courseLevel: string
  courseDate: string | null
  maxCount: number
  enrolledCount: number
  expiredAt: Date | null
  variant?: 'compact' | 'full'
  href?: string
  startedAt?: Date | null
  cancelledAt?: Date | null
  completedAt?: Date | null
}

// 課程等級對應的標籤顏色
const LEVEL_COLORS: Record<string, string> = {
  level1: 'bg-blue-100 text-blue-700',
  level2: 'bg-green-100 text-green-700',
  level3: 'bg-purple-100 text-purple-700',
  level4: 'bg-orange-100 text-orange-700',
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function CourseSessionCard({
  title,
  courseLevel,
  courseDate,
  maxCount,
  enrolledCount,
  expiredAt,
  variant = 'compact',
  href,
  startedAt,
  cancelledAt,
  completedAt,
}: CourseSessionCardProps) {
  const catalogEntry = COURSE_CATALOG[courseLevel as CourseLevel]
  const levelLabel = catalogEntry?.label ?? courseLevel
  const levelColor = LEVEL_COLORS[courseLevel] ?? 'bg-gray-100 text-gray-700'

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
          {status && (
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[status])}>
              {STATUS_LABELS[status]}
            </span>
          )}
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', levelColor)}>
            {levelLabel}
          </span>
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
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
