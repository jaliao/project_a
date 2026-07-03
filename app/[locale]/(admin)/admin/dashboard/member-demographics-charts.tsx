/*
 * ----------------------------------------------
 * 儀錶板 - 會員性別圓餅圖 / 各年齡會員人數柱狀圖
 * 2026-07-02
 * app/[locale]/(admin)/admin/dashboard/member-demographics-charts.tsx
 * ----------------------------------------------
 */

'use client'

import { Bar, BarChart, Pie, PieChart, XAxis } from 'recharts'
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
import type { AgeDistributionItem, GenderCounts } from '@/lib/data/dashboard'

// 性別固定 slot 順序（顏色跟實體）：男=chart-1、女=chart-2、未設定=chart-3
const genderChartConfig = {
  members: { label: '會員數' },
  male: { label: '男', color: 'hsl(var(--chart-1))' },
  female: { label: '女', color: 'hsl(var(--chart-2))' },
  unspecified: { label: '未設定', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig

export function GenderPieCard({ genderCounts }: { genderCounts: GenderCounts }) {
  const chartData = [
    { gender: 'male', members: genderCounts.male, fill: 'hsl(var(--chart-1))' },
    { gender: 'female', members: genderCounts.female, fill: 'hsl(var(--chart-2))' },
    { gender: 'unspecified', members: genderCounts.unspecified, fill: 'hsl(var(--chart-3))' },
  ].filter((d) => d.members > 0)

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">會員性別</CardTitle>
        <CardDescription>全體會員的性別分布</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">尚無會員資料</p>
          </div>
        ) : (
          <ChartContainer
            config={genderChartConfig}
            className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="members" label nameKey="gender" />
              <ChartLegend
                content={<ChartLegendContent nameKey="gender" />}
                className="flex-wrap gap-2 *:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// 年齡柱狀圖（單一序列，固定七組距）
const ageChartConfig = {
  count: { label: '會員數', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

export function AgeBarCard({
  ageDistribution,
  noBirthYearCount,
}: {
  ageDistribution: AgeDistributionItem[]
  noBirthYearCount: number
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          各年齡會員人數
        </CardTitle>
        <CardDescription>依出生年推算（已填出生年的會員）</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-4 pb-0">
        <ChartContainer config={ageChartConfig} className="max-h-[250px] w-full">
          <BarChart accessibilityLayer data={ageDistribution}>
            <XAxis
              dataKey="bucket"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1 text-sm">
        <div className="leading-none text-muted-foreground">
          未填出生年 {noBirthYearCount.toLocaleString()} 人（不列入柱狀）
        </div>
      </CardFooter>
    </Card>
  )
}
