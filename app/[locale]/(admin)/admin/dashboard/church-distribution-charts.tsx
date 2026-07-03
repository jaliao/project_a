/*
 * ----------------------------------------------
 * 儀錶板 - 各教會會員數 Top 5 / Low 5 圓餅圖
 * 2026-07-02
 * app/[locale]/(admin)/admin/dashboard/church-distribution-charts.tsx
 * ----------------------------------------------
 */

'use client'

import { Pie, PieChart } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { ChurchDistributionItem } from '@/lib/data/dashboard'

type Props = {
  distribution: ChurchDistributionItem[]
  otherCount: number
  noneCount: number
}

// 單張圓餅圖卡（依 slot 順序上色，數值標籤＋tooltip＋圖例）
function ChurchPieCard({
  title,
  description,
  items,
  footer,
}: {
  title: string
  description: string
  items: ChurchDistributionItem[]
  footer?: React.ReactNode
}) {
  const chartData = items.map((item, i) => ({
    church: item.name,
    members: item.count,
    fill: `hsl(var(--chart-${(i % 5) + 1}))`,
  }))
  const chartConfig = items.reduce<ChartConfig>(
    (config, item) => {
      config[item.name] = { label: item.name }
      return config
    },
    { members: { label: '會員數' } }
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="members" label nameKey="church" />
            <ChartLegend
              content={<ChartLegendContent nameKey="church" />}
              className="flex-wrap gap-2 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col gap-1 text-sm">
          <div className="leading-none text-muted-foreground">{footer}</div>
        </CardFooter>
      )}
    </Card>
  )
}

export function ChurchDistributionCharts({ distribution, otherCount, noneCount }: Props) {
  // Top 5：人數最多前五間；Low 5：其餘教會中人數最少五間（≤ 5 間時不顯示）
  const top5 = distribution.slice(0, 5)
  const low5 = distribution.slice(5).slice(-5)
  const footerNote = `其他（自填）${otherCount.toLocaleString()} 人・未填 ${noneCount.toLocaleString()} 人`

  if (top5.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            各教會的會員總數
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">尚無教會會員資料</p>
        </CardContent>
        <CardFooter className="flex-col gap-1 text-sm">
          <div className="leading-none text-muted-foreground">{footerNote}</div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <>
      <ChurchPieCard
        title="各教會的會員總數 Top 5"
        description="人數最多的前五間教會"
        items={top5}
        footer={footerNote}
      />
      {low5.length > 0 && (
        <ChurchPieCard
          title="各教會的會員總數 Low 5"
          description="其餘教會中人數最少的五間"
          items={low5}
        />
      )}
    </>
  )
}
