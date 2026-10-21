/*
 * ----------------------------------------------
 * Data Layer - 後台「教會冊別成長分析」統計推導
 * 2026-10-21
 * lib/data/church-course-growth.ts
 *
 * 統計口徑比照 lib/data/monthly-report.ts（approved、同冊跨班去重累計、
 * 教會歸屬規則），但推廣為任意冊別、單一年度 1~12 月的累計序列。
 * 全部即時由既有時間戳推導，不另存快照。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'
import { getAllCourses } from '@/lib/data/course-catalog'

const REPORT_TZ = 'Asia/Taipei'
const OTHER_UNIT_LABEL = '其他／未填'
const CHART_TOP_N = 8

// ==========================================
// 對外型別
// ==========================================
export type GrowthMonthPoint = {
  month: number // 1~12
  newCount: number
  cumTotal: number
}

export type ChurchGrowthRow = {
  churchId: number | null // null = 「其他／未填」彙總列
  name: string
  months: GrowthMonthPoint[] // 長度 = availableMonths
  yearTotal: number // 最後可用月累計 - 去年底累計
}

export type ChurchCourseGrowthReport = {
  year: string
  availableMonths: number // 1~12
  catalogId: number
  catalogLabel: string
  hasData: boolean
  rows: ChurchGrowthRow[] // 全部有資料（累計 > 0）的教會，含「其他/未填」，累計多到少排序、其他固定置底
  chartChurchIds: (number | null)[] // 前 8 名 + 其他/未填（若 > 0）
  overallYearTotal: number
  overallCumTotal: number
}

// ==========================================
// 年月工具（Asia/Taipei）
// ==========================================
function taipeiYear(date: Date): number {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TZ,
    year: 'numeric',
  }).format(date)
  return Number(s)
}

function taipeiYearMonth(date: Date): { year: number; month: number } {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  const [y, m] = s.split('-').map(Number)
  return { year: y, month: m }
}

/** 年度 13 個邊界：b[0] = 該年 1/1 00:00+08（去年底基準），b[m] = 第 m 月次月 1 日 00:00+08 */
function yearBoundaries(year: number): Date[] {
  const bounds: Date[] = [new Date(`${year}-01-01T00:00:00+08:00`)]
  for (let m = 1; m <= 12; m++) {
    const ny = m === 12 ? year + 1 : year
    const nm = m === 12 ? 1 : m + 1
    bounds.push(new Date(`${ny}-${String(nm).padStart(2, '0')}-01T00:00:00+08:00`))
  }
  return bounds
}

/** 選定年度為今年時，僅算到目前月份；其餘年度算滿 12 個月 */
function availableMonthsOf(year: number): number {
  const now = taipeiYearMonth(new Date())
  if (year < now.year) return 12
  if (year > now.year) return 0
  return now.month
}

// ==========================================
// 可選年度 / 冊別清單
// ==========================================
export async function getAvailableGrowthYears(): Promise<
  { value: string; label: string }[]
> {
  const agg = await prisma.inviteEnrollment.aggregate({ _min: { joinedAt: true } })
  const currentYear = taipeiYear(new Date())
  const earliestYear = agg._min.joinedAt ? taipeiYear(agg._min.joinedAt) : currentYear

  const years: { value: string; label: string }[] = []
  for (let y = currentYear; y >= earliestYear; y--) {
    years.push({ value: String(y), label: `${y} 年` })
  }
  return years.length ? years : [{ value: String(currentYear), label: `${currentYear} 年` }]
}

export async function getCourseCatalogFilterOptions(): Promise<
  { id: number; label: string }[]
> {
  const courses = await getAllCourses()
  return courses.map((c) => ({ id: c.id, label: c.label }))
}

/** 驗證 year 參數；不合法或超出可選範圍 → 退回最新可選年度 */
function normalizeYear(year: string | undefined, available: string[]): string {
  const set = new Set(available)
  if (year && /^\d{4}$/.test(year) && set.has(year)) return year
  return available[0] ?? String(taipeiYear(new Date()))
}

// ==========================================
// 教會歸屬
// ==========================================
type ChurchRef = { churchId: number | null; churchType: 'church' | 'other' | 'none' }

function churchKeyOf(u: ChurchRef): number | null {
  return u.churchType === 'church' && u.churchId != null ? u.churchId : null
}

function unitName(key: number | null, nameByKey: Map<number, string>): string {
  if (key == null) return OTHER_UNIT_LABEL
  return nameByKey.get(key) ?? `（教會 #${key}）`
}

// ==========================================
// 主查詢
// ==========================================
export async function getChurchCourseGrowth(
  catalogId: number,
  year?: string,
  availableYears?: { value: string; label: string }[],
): Promise<ChurchCourseGrowthReport> {
  const [years, catalog] = await Promise.all([
    availableYears ? Promise.resolve(availableYears) : getAvailableGrowthYears(),
    prisma.courseCatalog.findUnique({ where: { id: catalogId }, select: { label: true } }),
  ])
  const normalizedYear = normalizeYear(year, years.map((y) => y.value))
  const yearNum = Number(normalizedYear)
  const bounds = yearBoundaries(yearNum)
  const availableMonths = availableMonthsOf(yearNum)
  const catalogLabel = catalog?.label ?? `（冊 #${catalogId}）`

  if (availableMonths === 0) {
    return {
      year: normalizedYear,
      availableMonths: 0,
      catalogId,
      catalogLabel,
      hasData: false,
      rows: [],
      chartChurchIds: [],
      overallYearTotal: 0,
      overallCumTotal: 0,
    }
  }

  // 查詢截至選定年度最後可用月底前，該冊全部核准報名
  const lastBound = bounds[availableMonths]
  const enrollments = await prisma.inviteEnrollment.findMany({
    where: {
      status: 'approved',
      joinedAt: { lt: lastBound },
      invite: { courseCatalogId: catalogId },
    },
    select: {
      userId: true,
      joinedAt: true,
      user: { select: { churchId: true, churchType: true } },
    },
  })

  // 依 userId 去重，取最早 joinedAt（同一冊跨班不重複計入）
  const userEarliest = new Map<string, { key: number | null; at: Date }>()
  for (const r of enrollments) {
    const key = churchKeyOf(r.user)
    const cur = userEarliest.get(r.userId)
    if (!cur || r.joinedAt < cur.at) userEarliest.set(r.userId, { key, at: r.joinedAt })
  }

  if (userEarliest.size === 0) {
    return {
      year: normalizedYear,
      availableMonths,
      catalogId,
      catalogLabel,
      hasData: false,
      rows: [],
      chartChurchIds: [],
      overallYearTotal: 0,
      overallCumTotal: 0,
    }
  }

  // 每個邊界（0=去年底基準, 1~availableMonths=各月底）下，各 churchKey 的累計人數。
  // 做法：依 key 分組並各自排序 joinedAt，再用單調遊標（只增不減）依序推進各邊界，
  // 避免「每個邊界對每個 key 重新線性掃描全部報名」的 O(邊界數 × key 數 × 報名數)。
  const timesByKey = new Map<number | null, number[]>()
  for (const { key, at } of userEarliest.values()) {
    const arr = timesByKey.get(key) ?? []
    arr.push(at.getTime())
    timesByKey.set(key, arr)
  }
  const keys = [...timesByKey.keys()]
  const cumByKey = new Map<number | null, number[]>()
  for (const key of keys) {
    const times = timesByKey.get(key)!
    times.sort((a, b) => a - b)
    const cum = new Array(availableMonths + 1).fill(0)
    let idx = 0
    for (let b = 0; b <= availableMonths; b++) {
      const cutoff = bounds[b].getTime()
      while (idx < times.length && times[idx] < cutoff) idx++
      cum[b] = idx
    }
    cumByKey.set(key, cum)
  }

  const allTimes = [...userEarliest.values()].map((v) => v.at.getTime()).sort((a, b) => a - b)
  const overallCum = new Array(availableMonths + 1).fill(0)
  {
    let idx = 0
    for (let b = 0; b <= availableMonths; b++) {
      const cutoff = bounds[b].getTime()
      while (idx < allTimes.length && allTimes[idx] < cutoff) idx++
      overallCum[b] = idx
    }
  }

  // 教會名稱
  const churchIds = keys.filter((k): k is number => k != null)
  const churches = churchIds.length
    ? await prisma.church.findMany({ where: { id: { in: churchIds } }, select: { id: true, name: true } })
    : []
  const nameByKey = new Map<number, string>(churches.map((c) => [c.id, c.name]))

  const rows: ChurchGrowthRow[] = keys
    .map((key) => {
      const cum = cumByKey.get(key)!
      const months: GrowthMonthPoint[] = []
      for (let m = 1; m <= availableMonths; m++) {
        months.push({ month: m, newCount: cum[m] - cum[m - 1], cumTotal: cum[m] })
      }
      return {
        churchId: key,
        name: unitName(key, nameByKey),
        months,
        yearTotal: cum[availableMonths] - cum[0],
      }
    })
    .filter((row) => row.months[availableMonths - 1].cumTotal > 0)
    .sort((a, b) => {
      if ((a.churchId == null) !== (b.churchId == null)) return a.churchId == null ? 1 : -1
      return b.months[availableMonths - 1].cumTotal - a.months[availableMonths - 1].cumTotal
    })

  const chartChurchIds = rows
    .filter((r) => r.churchId != null)
    .slice(0, CHART_TOP_N)
    .map((r) => r.churchId)
  const otherRow = rows.find((r) => r.churchId == null)
  if (otherRow && otherRow.months[availableMonths - 1].cumTotal > 0) {
    chartChurchIds.push(null)
  }

  return {
    year: normalizedYear,
    availableMonths,
    catalogId,
    catalogLabel,
    hasData: rows.length > 0,
    rows,
    chartChurchIds,
    overallYearTotal: overallCum[availableMonths] - overallCum[0],
    overallCumTotal: overallCum[availableMonths],
  }
}
