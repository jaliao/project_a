/*
 * ----------------------------------------------
 * 後台「教會冊別成長分析」頁面
 * 2026-10-21
 * app/[locale]/(admin)/admin/analytics/church-course-growth/page.tsx
 *
 * 守衛（登入 + admin 身分）由 (admin)/layout.tsx 統一處理。
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import {
  getAvailableGrowthYears,
  getCourseCatalogFilterOptions,
  getChurchCourseGrowth,
} from '@/lib/data/church-course-growth'
import ChurchCourseGrowthFilters from './church-course-growth-filters'
import ChurchCourseGrowthChart from './church-course-growth-chart'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '教會冊別成長分析 — 啟動事工',
}

const DASH = '—'
const fmtInt = (n: number) => n.toLocaleString()
const fmtSigned = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString()}`

export default async function ChurchCourseGrowthPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; catalogId?: string }>
}) {
  const { year, catalogId: catalogIdParam } = await searchParams
  const [years, catalogs] = await Promise.all([
    getAvailableGrowthYears(),
    getCourseCatalogFilterOptions(),
  ])

  const requestedCatalogId = catalogIdParam ? Number(catalogIdParam) : NaN
  const catalogId =
    catalogs.find((c) => c.id === requestedCatalogId)?.id ?? catalogs[0]?.id ?? 0

  const report = await getChurchCourseGrowth(catalogId, year)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">教會冊別成長分析</h1>
        <ChurchCourseGrowthFilters
          year={report.year}
          catalogId={catalogId}
          years={years}
          catalogs={catalogs}
        />
      </div>

      {!report.hasData ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {report.catalogLabel}在 {report.year} 年尚無報名資料
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-5 space-y-1">
              <p className="text-sm text-muted-foreground">
                {report.catalogLabel}・全教會累計人數（至 {report.availableMonths} 月底）
              </p>
              <p className="text-3xl font-bold">{fmtInt(report.overallCumTotal)}</p>
            </div>
            <div className="rounded-lg border p-5 space-y-1">
              <p className="text-sm text-muted-foreground">
                {report.year} 年度全教會新增人數
              </p>
              <p className="text-3xl font-bold">{fmtSigned(report.overallYearTotal)}</p>
            </div>
          </div>

          <ChurchCourseGrowthChart report={report} />

          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="sticky left-0 bg-muted/40 px-4 py-3">教會</th>
                  {Array.from({ length: report.availableMonths }, (_, i) => (
                    <th key={i + 1} className="px-3 py-3 text-right whitespace-nowrap">
                      {i + 1} 月（新增／累計）
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right whitespace-nowrap">年度新增</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.churchId ?? 'other'} className="border-b last:border-0">
                    <td className="sticky left-0 bg-background px-4 py-3 whitespace-nowrap">
                      {row.name}
                    </td>
                    {row.months.map((m) => (
                      <td key={m.month} className="px-3 py-3 text-right whitespace-nowrap">
                        <span className="text-muted-foreground">
                          {m.newCount === 0 ? DASH : fmtSigned(m.newCount)}
                        </span>
                        {' / '}
                        <span className="font-medium">{fmtInt(m.cumTotal)}</span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-medium">
                      {fmtSigned(row.yearTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
