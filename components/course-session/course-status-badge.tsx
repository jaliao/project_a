/*
 * ----------------------------------------------
 * CourseStatusBadge - 課程狀態標籤共用元件
 * 2026-04-07
 * components/course-session/course-status-badge.tsx
 * ----------------------------------------------
 */

import { cn } from '@/lib/utils'

export type CourseStatus = 'recruiting' | 'active' | 'completed' | 'cancelled'

const STATUS_LABELS: Record<CourseStatus, string> = {
  recruiting: '招生中',
  active: '進行中',
  completed: '已結業',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<CourseStatus, string> = {
  recruiting: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function getCourseStatus(item: {
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

type Props = {
  status: CourseStatus
  size?: 'sm' | 'md'
  className?: string
}

export function CourseStatusBadge({ status, size = 'md', className }: Props) {
  return (
    <span
      className={cn(
        'rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        STATUS_COLORS[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
