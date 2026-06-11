/*
 * ----------------------------------------------
 * CourseStatusSelect - 後台課程狀態 inline 下拉
 * 2026-06-11
 * components/course-session/course-status-select.tsx
 * ----------------------------------------------
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setCourseStatusAdmin } from '@/app/actions/course-session'

type CourseStatus = 'recruiting' | 'started' | 'completed' | 'cancelled'

// 可由管理者設定的目標狀態（不含已結業）
const SETTABLE_OPTIONS: { value: 'recruiting' | 'started' | 'cancelled'; label: string }[] = [
  { value: 'recruiting', label: '招生中' },
  { value: 'started', label: '進行中' },
  { value: 'cancelled', label: '已取消' },
]

interface CourseStatusSelectProps {
  inviteId: number
  current: CourseStatus
}

export function CourseStatusSelect({ inviteId, current }: CourseStatusSelectProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState<CourseStatus>(current)

  // 已結業課程不可於後台變更，下拉以停用顯示當前狀態
  if (current === 'completed') {
    return (
      <select
        className="h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground"
        value="completed"
        disabled
      >
        <option value="completed">已結業</option>
      </select>
    )
  }

  const handleChange = (next: 'recruiting' | 'started' | 'cancelled') => {
    if (next === value) return
    const prev = value
    setValue(next)
    startTransition(async () => {
      const res = await setCourseStatusAdmin(inviteId, next)
      if (res.success) {
        toast.success(res.message ?? '已變更狀態')
        router.refresh()
      } else {
        setValue(prev) // 失敗回復
        toast.error(res.message ?? '變更失敗')
      }
    })
  }

  return (
    <select
      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
      value={value}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as 'recruiting' | 'started' | 'cancelled')}
    >
      {SETTABLE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
