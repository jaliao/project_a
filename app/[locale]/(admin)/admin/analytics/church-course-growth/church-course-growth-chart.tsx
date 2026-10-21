/*
 * ----------------------------------------------
 * 後台「教會冊別成長分析」- 累計人數折線圖
 * 2026-10-21
 * app/[locale]/(admin)/admin/analytics/church-course-growth/church-course-growth-chart.tsx
 *
 * 僅畫出 report.chartChurchIds（累計人數前 8 名教會＋其他/未填），
 * 比照 dashboard/church-distribution-charts.tsx 的 ChartContainer 用法。
 * ----------------------------------------------
 */

'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { ChurchCourseGrowthReport } from '@/lib/data/church-course-growth'

type Props = {
  report: ChurchCourseGrowthReport
}

const OTHER_KEY = 'other'

function churchDataKey(churchId: number | null): string {
  return churchId == null ? OTHER_KEY : `church_${churchId}`
}

export default function ChurchCourseGrowthChart({ report }: Props) {
  const { rows, chartChurchIds, availableMonths } = report
  const rowByKey = new Map(rows.map((r) => [r.churchId, r]))

  const chartData = Array.from({ length: availableMonths }, (_, i) => {
    const month = i + 1
    const point: Record<string, number | string> = { monthLabel: `${month}月` }
    for (const churchId of chartChurchIds) {
      const row = rowByKey.get(churchId)
      point[churchDataKey(churchId)] = row?.months[i]?.cumTotal ?? 0
    }
    return point
  })

  const chartConfig = chartChurchIds.reduce<ChartConfig>((config, churchId, i) => {
    const row = rowByKey.get(churchId)
    config[churchDataKey(churchId)] = {
      label: row?.name ?? '其他／未填',
      color: `hsl(var(--chart-${(i % 5) + 1}))`,
    }
    return config
  }, {})

  return (
    <div className="space-y-2">
      <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
        <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          {chartChurchIds.map((churchId) => (
            <Line
              key={churchDataKey(churchId)}
              type="monotone"
              dataKey={churchDataKey(churchId)}
              stroke={`var(--color-${churchDataKey(churchId)})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        僅顯示累計人數前 8 名教會，完整名單見下方表格。
      </p>
    </div>
  )
}
