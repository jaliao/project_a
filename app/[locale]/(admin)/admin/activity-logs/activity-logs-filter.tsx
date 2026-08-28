/*
 * ----------------------------------------------
 * 後台系統活動紀錄篩選列（Client Component）
 * 2026-08-28
 * app/[locale]/(admin)/admin/activity-logs/activity-logs-filter.tsx
 * ----------------------------------------------
 */

'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { ADMIN_LOG_ACTIONS, ADMIN_LOG_ACTION_VALUES } from '@/config/admin-log-action'

interface ActivityLogsFilterProps {
  defaultAction?: string
  defaultQ?: string
  defaultFrom?: string
  defaultTo?: string
}

export function ActivityLogsFilter({
  defaultAction = '',
  defaultQ = '',
  defaultFrom = '',
  defaultTo = '',
}: ActivityLogsFilterProps) {
  const router = useRouter()

  // 任一條件變更都以「新的一組參數」重建 querystring，並移除 page（回到第 1 頁）
  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = { action: defaultAction, q: defaultQ, from: defaultFrom, to: defaultTo, ...updates }
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value)
      }
      const qs = params.toString()
      router.push(qs ? `/admin/activity-logs?${qs}` : '/admin/activity-logs')
    },
    [router, defaultAction, defaultQ, defaultFrom, defaultTo]
  )

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* 動作類型 */}
      <select
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        defaultValue={defaultAction}
        onChange={(e) => push({ action: e.target.value })}
        aria-label="動作類型"
      >
        <option value="">全部動作</option>
        {ADMIN_LOG_ACTION_VALUES.map((v) => (
          <option key={v} value={v}>
            {ADMIN_LOG_ACTIONS[v].label}
          </option>
        ))}
      </select>

      {/* 關鍵字（比對操作者／對象／班級／摘要） */}
      <div className="min-w-48 flex-1">
        <Input
          placeholder="搜尋操作者、對象、班級、摘要…"
          defaultValue={defaultQ}
          onKeyDown={(e) => {
            if (e.key === 'Enter') push({ q: (e.target as HTMLInputElement).value })
          }}
          onBlur={(e) => push({ q: e.target.value })}
        />
      </div>

      {/* 日期區間（套用於發生時間） */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="whitespace-nowrap text-muted-foreground">發生時間</span>
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm"
          defaultValue={defaultFrom}
          onChange={(e) => push({ from: e.target.value })}
          aria-label="起日"
        />
        <span className="text-muted-foreground">—</span>
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm"
          defaultValue={defaultTo}
          onChange={(e) => push({ to: e.target.value })}
          aria-label="訖日"
        />
      </div>
    </div>
  )
}
