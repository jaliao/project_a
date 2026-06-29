/*
 * ----------------------------------------------
 * 後台開課管理篩選列（Client Component）
 * 2026-04-03
 * app/(user)/admin/course-sessions/course-sessions-filter.tsx
 * ----------------------------------------------
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'

type CatalogOption = { id: number; label: string }

const STATUS_OPTIONS = [
  { value: '', label: '全部進度' },
  { value: 'recruiting', label: '招生中' },
  { value: 'started', label: '進行中' },
  { value: 'completed', label: '已結業' },
  { value: 'cancelled', label: '已取消' },
]

interface CourseSessionsFilterProps {
  catalogs: CatalogOption[]
  defaultQ?: string
  defaultCatalogId?: string
  defaultStatus?: string
  defaultStartDate?: string
  defaultEndDate?: string
}

export function CourseSessionsFilter({
  catalogs,
  defaultQ = '',
  defaultCatalogId = '',
  defaultStatus = '',
  defaultStartDate = '',
  defaultEndDate = '',
}: CourseSessionsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* 文字搜尋 */}
      <div className="flex-1 min-w-48">
        <Input
          placeholder="搜尋課程名稱、講師、學員…"
          defaultValue={defaultQ}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              push({ q: (e.target as HTMLInputElement).value, })
            }
          }}
          onBlur={(e) => push({ q: e.target.value })}
        />
      </div>

      {/* 課程名稱下拉 */}
      <select
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        defaultValue={defaultCatalogId}
        onChange={(e) => push({ catalogId: e.target.value })}
      >
        <option value="">全部課程</option>
        {catalogs.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.label}
          </option>
        ))}
      </select>

      {/* 進度下拉 */}
      <select
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        defaultValue={defaultStatus}
        onChange={(e) => push({ status: e.target.value })}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* 開課日期起 */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground whitespace-nowrap">開課日期</span>
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm"
          defaultValue={defaultStartDate}
          onChange={(e) => push({ startDate: e.target.value })}
        />
        <span className="text-muted-foreground">—</span>
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm"
          defaultValue={defaultEndDate}
          onChange={(e) => push({ endDate: e.target.value })}
        />
      </div>
    </div>
  )
}
