/*
 * ----------------------------------------------
 * 儀錶板圖表元件（Client Component）
 * 2026-04-03
 * app/(user)/admin/dashboard/dashboard-charts.tsx
 * ----------------------------------------------
 */

'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type CourseStatItem = {
  catalogId: number
  label: string
  count: number
}

type Range = '3m' | '30d' | '7d'

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '3m', label: '3個月內' },
  { value: '30d', label: '30天內' },
  { value: '7d', label: '7天內' },
]

// 課程目錄顏色（與 CourseSessionCard 一致）
const CATALOG_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
]

function getCatalogColor(id: number): string {
  return CATALOG_COLORS[(id - 1) % CATALOG_COLORS.length]
}

interface DashboardChartsProps {
  startStats: CourseStatItem[]
  graduationStats: CourseStatItem[]
  range: Range
}

function CourseBarChart({ data, title }: { data: CourseStatItem[]; title: string }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        此時間區間內無資料
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [value, '次數']}
            labelFormatter={(label) => `課程：${label}`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.catalogId} fill={getCatalogColor(entry.catalogId)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DashboardCharts({ startStats, graduationStats, range }: DashboardChartsProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* 時間區間切換 */}
      <div className="flex gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => router.push(`?range=${opt.value}`)}
            className={
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors ' +
              (range === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-input bg-background hover:bg-muted')
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 圖表 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <CourseBarChart data={startStats} title="上課人次（依課程類別）" />
        </div>
        <div className="rounded-lg border p-5">
          <CourseBarChart data={graduationStats} title="順利結業人數（依課程類別）" />
        </div>
      </div>
    </div>
  )
}
