/*
 * ----------------------------------------------
 * 後台儀錶板 - 月報區塊
 * 2026-09-01
 * app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx
 *
 * 四子區塊：總體分析／世代倍增／第一冊各單位／第二冊各單位。
 * 資料由 lib/data/monthly-report.ts 即時推導，本檔僅呈現。
 * 月份切換以 ?month=YYYY-MM 查詢參數表示（locale-aware 導向）。
 * 後台字串維持繁體硬字串（CLAUDE.md 第 12 點）。
 * ----------------------------------------------
 */

'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import type { MonthlyReport } from '@/lib/data/monthly-report'

type Props = {
  report: MonthlyReport
  months: { value: string; label: string }[]
}

const DASH = '—'

const fmtInt = (n: number) => n.toLocaleString()
const fmtSigned = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString()}`
const fmtRate = (v: number | null, digits = 1) =>
  v == null ? DASH : `${v.toFixed(digits)}%`
const fmtGrowth = (v: number | null, digits = 1) =>
  v == null ? DASH : `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`

function MonthSelect({
  value,
  months,
}: {
  value: string
  months: { value: string; label: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <select
      value={value}
      onChange={(e) => router.push(`${pathname}?month=${e.target.value}`)}
      className="h-9 rounded-md border bg-background px-3 text-sm"
      aria-label="選擇月份"
    >
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  )
}

function ReportCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-5 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function MonthlyReportSection({ report, months }: Props) {
  const {
    book1,
    book2,
    milestone,
    topMovers,
    generations,
    book1Units,
    book2Units,
    book2UnitsTotal,
  } = report
  const maxGenCount = Math.max(1, ...generations.buckets.map((b) => b.count))

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">月報</h2>
        <MonthSelect value={report.month} months={months} />
      </div>

      {/* 一、總體分析 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          總體分析（{report.monthLabel}）
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ReportCard
            label="第一冊（啟動靈人）累計參與人數"
            value={fmtInt(book1.cumTotal)}
            sub={
              <>
                本月 {fmtSigned(book1.momDelta)} 人（{fmtGrowth(book1.momRatePct)}
                ）
              </>
            }
          />
          <ReportCard
            label="第二冊（啟動豐盛）累計參與人數"
            value={fmtInt(book2.cumTotal)}
            sub={
              <>
                本月 {fmtSigned(book2.momDelta)} 人（{fmtGrowth(book2.momRatePct)}
                ）
              </>
            }
          />
          <ReportCard
            label="第一冊 → 第二冊 已開課單位整體轉換率"
            value={fmtRate(milestone.ratePct, 0)}
            sub={
              <>
                {fmtInt(milestone.numerator)} ÷ {fmtInt(milestone.denominator)}
              </>
            }
          />
        </div>
        {(topMovers.book1.length > 0 || topMovers.book2.length > 0) && (
          <p className="text-sm text-muted-foreground">
            本月成長最多：
            {topMovers.book1.length > 0 && (
              <>
                {' '}
                第一冊{' '}
                {topMovers.book1
                  .map((m) => `${m.name} ${fmtSigned(m.momDelta)} 人`)
                  .join('、')}
              </>
            )}
            {topMovers.book2.length > 0 && (
              <>
                ；第二冊{' '}
                {topMovers.book2
                  .map((m) => `${m.name} ${fmtSigned(m.momDelta)} 人`)
                  .join('、')}
              </>
            )}
          </p>
        )}
      </div>

      {/* 二、世代倍增 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          世代倍增發展追蹤（共 {fmtInt(generations.teacherTotal)} 位教師）
        </h3>
        {generations.buckets.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            本月無資料
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border p-5">
            {generations.buckets.map((b) => (
              <div key={b.generation} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm text-muted-foreground">
                  第 {b.generation} 代
                </span>
                <div className="h-4 flex-1 rounded bg-muted">
                  <div
                    className="h-4 rounded bg-primary/70"
                    style={{ width: `${(b.count / maxGenCount) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-medium">
                  {fmtInt(b.count)} 人
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 三、第一冊各單位 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          第一冊：啟動靈人各單位發展狀況
        </h3>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">單位</th>
                <th className="px-4 py-3 text-right">累計總人數</th>
                <th className="px-4 py-3 text-right">月成長人數</th>
                <th className="px-4 py-3">人數佔比</th>
                <th className="px-4 py-3 text-right">增加組數</th>
              </tr>
            </thead>
            <tbody>
              {book1Units.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    本月無資料
                  </td>
                </tr>
              ) : (
                book1Units.map((u) => (
                  <tr
                    key={u.churchId ?? 'other'}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-right">
                      {fmtInt(u.cumTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {u.momDelta === 0 ? DASH : fmtSigned(u.momDelta)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 shrink-0 rounded bg-muted">
                          <div
                            className="h-2 rounded bg-primary/70"
                            style={{ width: `${Math.min(100, u.sharePct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {u.sharePct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {u.addedGroups === 0 ? DASH : `+${u.addedGroups}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 四、第二冊各單位 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          第二冊：啟動豐盛各單位發展狀況（限已開課單位）
        </h3>
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">單位</th>
                <th className="px-4 py-3 text-right">累計總人數</th>
                <th className="px-4 py-3 text-right">月成長人數</th>
                <th className="px-4 py-3 text-right">增加組數</th>
                <th className="px-4 py-3">佔該單位第一冊比</th>
              </tr>
            </thead>
            <tbody>
              {book2Units.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    本月無資料
                  </td>
                </tr>
              ) : (
                <>
                  {book2Units.map((u) => (
                    <tr key={u.churchId ?? 'other'} className="border-b">
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 text-right">
                        {fmtInt(u.cumTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {u.momDelta === 0 ? DASH : fmtSigned(u.momDelta)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {u.addedGroups === 0 ? DASH : `+${u.addedGroups}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.unitConversionPct == null
                          ? DASH
                          : `${fmtInt(u.cumTotal)} / ${fmtInt(u.book1CumTotal)}人　${u.unitConversionPct.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-medium">
                    <td className="px-4 py-3">總計</td>
                    <td className="px-4 py-3 text-right">
                      {fmtInt(book2UnitsTotal.cumTotal)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {book2UnitsTotal.momDelta === 0
                        ? DASH
                        : fmtSigned(book2UnitsTotal.momDelta)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {book2UnitsTotal.addedGroups === 0
                        ? DASH
                        : `+${book2UnitsTotal.addedGroups}`}
                    </td>
                    <td className="px-4 py-3">
                      整體轉換率 {fmtRate(book2UnitsTotal.conversionPct, 0)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
