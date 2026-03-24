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

type CourseSessionCardProps = {
  title: string
  courseLevel: string
  courseDate: string | null
  maxCount: number
  enrolledCount: number
  expiredAt: Date | null
  variant?: 'compact' | 'full'
  href?: string
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
}: CourseSessionCardProps) {
  const catalogEntry = COURSE_CATALOG[courseLevel as CourseLevel]
  const levelLabel = catalogEntry?.label ?? courseLevel
  const levelColor = LEVEL_COLORS[courseLevel] ?? 'bg-gray-100 text-gray-700'

  const card = (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3',
        variant === 'full' && 'p-5',
        href && 'cursor-pointer transition-shadow hover:shadow-md'
      )}
    >
      {/* 標題與等級 */}
      <div className="flex items-start justify-between gap-2">
        <p className={cn('font-semibold text-sm', variant === 'full' && 'text-base')}>
          {title}
        </p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            levelColor
          )}
        >
          {levelLabel}
        </span>
      </div>

      {/* 資訊列 */}
      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {/* 人數 */}
        <div className="flex items-center gap-1.5">
          <IconUsers className="h-3.5 w-3.5 shrink-0" />
          <span>
            已報名 {enrolledCount} / 預計 {maxCount} 人
          </span>
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
