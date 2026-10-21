/*
 * ----------------------------------------------
 * 後台「教會冊別成長分析」- 年度/冊別篩選
 * 2026-10-21
 * app/[locale]/(admin)/admin/analytics/church-course-growth/church-course-growth-filters.tsx
 *
 * 篩選以 ?year=YYYY&catalogId=N 查詢參數表示（locale-aware 導向），
 * 比照 dashboard/monthly-report-section.tsx 的 MonthSelect 寫法。
 * ----------------------------------------------
 */

'use client'

import { usePathname, useRouter } from '@/i18n/navigation'

type Props = {
  year: string
  catalogId: number
  years: { value: string; label: string }[]
  catalogs: { id: number; label: string }[]
}

export default function ChurchCourseGrowthFilters({
  year,
  catalogId,
  years,
  catalogs,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = (nextYear: string, nextCatalogId: number) => {
    router.push(`${pathname}?year=${nextYear}&catalogId=${nextCatalogId}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={catalogId}
        onChange={(e) => navigate(year, Number(e.target.value))}
        className="h-9 rounded-md border bg-background px-3 text-sm"
        aria-label="選擇冊別"
      >
        {catalogs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => navigate(e.target.value, catalogId)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
        aria-label="選擇年度"
      >
        {years.map((y) => (
          <option key={y.value} value={y.value}>
            {y.label}
          </option>
        ))}
      </select>
    </div>
  )
}
