/*
 * ----------------------------------------------
 * CourseStatusBadge - 課程狀態標籤共用元件
 * 2026-04-07
 * components/course-session/course-status-badge.tsx
 * ----------------------------------------------
 */

'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CourseStatus } from './course-status'

const STATUS_COLORS: Record<CourseStatus, string> = {
  recruiting: 'bg-yellow-100 text-yellow-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

type Props = {
  status: CourseStatus
  size?: 'sm' | 'md'
  className?: string
}

export function CourseStatusBadge({ status, size = 'md', className }: Props) {
  const t = useTranslations('status')
  return (
    <span
      className={cn(
        'rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        STATUS_COLORS[status],
        className
      )}
    >
      {t(status)}
    </span>
  )
}
