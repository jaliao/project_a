/*
 * ----------------------------------------------
 * Data Layer - 後台儀錶板「月報」統計推導
 * 2026-09-01
 * lib/data/monthly-report.ts
 *
 * 依 doc/啟動8月月報.pdf 的四塊資訊，全部即時由既有時間戳推導：
 *   InviteEnrollment.joinedAt / graduatedAt、CourseInvite.createdAt / startedAt
 * 不另存每月快照。單位＝Church 逐間（other/none 彙總為「其他／未填」）。
 * 世代倍增由啟動靈人（courseCatalogId=1）師生傳承鏈推導。
 * ----------------------------------------------
 */

import { prisma } from '@/lib/prisma'

// 第一冊＝啟動靈人、第二冊＝啟動豐盛（見 lib/data/hierarchy.ts、config/learning-outline.ts）
export const BOOK1_CATALOG_ID = 1
export const BOOK2_CATALOG_ID = 2
// 世代鏈深度上限（超過即截斷，兼作環路保險）
const MAX_GEN = 10
// 事工在台灣，月份邊界一律以 Asia/Taipei 民用月計算
const REPORT_TZ = 'Asia/Taipei'
const OTHER_UNIT_LABEL = '其他／未填'

// ==========================================
// 對外型別
// ==========================================
export type UnitRow = {
  churchId: number | null // null = 「其他／未填」彙總列
  name: string
  cumTotal: number // 累計至本月底的去重人數
  momDelta: number // 累計至本月底 − 累計至上月底
  sharePct: number // cumTotal ÷ 該冊全體 cumTotal（0~100）
  addedGroups: number // 本月新增 CourseInvite 數（依建立者現況單位）
}

export type Book2UnitRow = UnitRow & {
  book1CumTotal: number // 同一單位第一冊累計（分母）
  unitConversionPct: number | null // book2 cumTotal ÷ book1CumTotal（分母 0 → null）
}

export type GenerationBucket = { generation: number; count: number }

export type MonthlyReport = {
  month: string // 正規化後的 YYYY-MM
  monthLabel: string // 「2026 年 8 月」
  hasData: boolean // 該月是否有任何可計算資料（第一冊 or 第二冊累計 > 0）
  // 一、總體分析
  book1: { cumTotal: number; momDelta: number; momRatePct: number | null }
  book2: { cumTotal: number; momDelta: number; momRatePct: number | null }
  milestone: { numerator: number; denominator: number; ratePct: number | null }
  topMovers: {
    book1: { name: string; momDelta: number }[]
    book2: { name: string; momDelta: number }[]
  }
  // 二、世代倍增
  generations: { teacherTotal: number; buckets: GenerationBucket[] }
  // 三、第一冊各單位
  book1Units: UnitRow[]
  // 四、第二冊各單位
  book2Units: Book2UnitRow[]
  book2UnitsTotal: {
    cumTotal: number
    momDelta: number
    addedGroups: number
    conversionPct: number | null
  }
}

// ==========================================
// 月份工具（Asia/Taipei）
// ==========================================

/** 某 UTC 瞬間在 Asia/Taipei 的年月字串（YYYY-MM） */
function taipeiYearMonth(date: Date): string {
  // en-CA 產出 YYYY-MM-DD
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return s.slice(0, 7)
}

/** YYYY-MM 位移 delta 個月 */
function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const idx = y * 12 + (m - 1) + delta
  const ny = Math.floor(idx / 12)
  const nm = (idx % 12) + 1
  return `${ny}-${String(nm).padStart(2, '0')}`
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  return `${y} 年 ${Number(m)} 月`
}

/**
 * 所選月的邊界（UTC Date）：
 * - prevEnd：所選月 1 日 00:00（+08:00）＝「累計至上月底」的排除上界
 * - end：次月 1 日 00:00（+08:00）＝「累計至本月底」的排除上界
 */
function taipeiMonthBounds(month: string): { prevEnd: Date; end: Date } {
  const next = addMonths(month, 1)
  return {
    prevEnd: new Date(`${month}-01T00:00:00+08:00`),
    end: new Date(`${next}-01T00:00:00+08:00`),
  }
}

/**
 * 可選月份清單：自最早一筆課程報名（joinedAt）所在月至今日所在月（Asia/Taipei），由新到舊。
 * 無任何報名時只回傳當月。
 */
export async function getAvailableReportMonths(): Promise<
  { value: string; label: string }[]
> {
  const agg = await prisma.inviteEnrollment.aggregate({ _min: { joinedAt: true } })
  const current = taipeiYearMonth(new Date())
  const earliest = agg._min.joinedAt
    ? taipeiYearMonth(agg._min.joinedAt)
    : current

  const months: { value: string; label: string }[] = []
  let cursor = current
  // 字典序比較對 YYYY-MM 等長字串成立
  while (cursor >= earliest) {
    months.push({ value: cursor, label: monthLabel(cursor) })
    if (cursor === earliest) break
    cursor = addMonths(cursor, -1)
  }
  return months.length ? months : [{ value: current, label: monthLabel(current) }]
}

/** 驗證 month 參數；不合法 → 上一個完整月份（不在可選範圍時退回最新可選月） */
function normalizeMonth(month: string | undefined, available: string[]): string {
  const set = new Set(available)
  if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && set.has(month)) return month
  const prev = addMonths(taipeiYearMonth(new Date()), -1)
  if (set.has(prev)) return prev
  return available[0] ?? taipeiYearMonth(new Date())
}

// ==========================================
// 單位（Church）歸屬
// ==========================================
type ChurchRef = { churchId: number | null; churchType: 'church' | 'other' | 'none' }

/** 單位 key：屬清單教會 → churchId，其餘（other/none）→ null（＝「其他／未填」） */
function churchKeyOf(u: ChurchRef): number | null {
  return u.churchType === 'church' && u.churchId != null ? u.churchId : null
}

/** userId → 現況單位 key */
async function churchKeyByUserIds(
  ids: string[],
): Promise<Map<string, number | null>> {
  const uniq = [...new Set(ids)]
  if (uniq.length === 0) return new Map()
  const users = await prisma.user.findMany({
    where: { id: { in: uniq } },
    select: { id: true, churchId: true, churchType: true },
  })
  return new Map(users.map((u) => [u.id, churchKeyOf(u)]))
}

// ==========================================
// 累計參與人數（去重、逐單位）
// ==========================================
type CumResult = {
  totalCum: number
  totalPrevCum: number
  byUnit: Map<number | null, { cum: number; prev: number }>
  // userId → { 現況單位 key, 該冊最早 approved 報名時間 }
  userKeys: Map<string, { key: number | null; earliest: Date }>
}

async function bookCumulative(
  cid: number,
  prevEnd: Date,
  end: Date,
): Promise<CumResult> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: {
      status: 'approved',
      joinedAt: { lt: end },
      invite: { courseCatalogId: cid },
    },
    select: {
      userId: true,
      joinedAt: true,
      user: { select: { churchId: true, churchType: true } },
    },
  })

  const userKeys = new Map<string, { key: number | null; earliest: Date }>()
  for (const r of rows) {
    const key = churchKeyOf(r.user)
    const cur = userKeys.get(r.userId)
    if (!cur) userKeys.set(r.userId, { key, earliest: r.joinedAt })
    else if (r.joinedAt < cur.earliest)
      userKeys.set(r.userId, { key, earliest: r.joinedAt })
  }

  const byUnit = new Map<number | null, { cum: number; prev: number }>()
  let totalCum = 0
  let totalPrevCum = 0
  for (const { key, earliest } of userKeys.values()) {
    totalCum++
    const isPrev = earliest < prevEnd
    if (isPrev) totalPrevCum++
    const b = byUnit.get(key) ?? { cum: 0, prev: 0 }
    b.cum++
    if (isPrev) b.prev++
    byUnit.set(key, b)
  }
  return { totalCum, totalPrevCum, byUnit, userKeys }
}

// ==========================================
// 本月增加組數（依建立者現況單位）
// ==========================================
async function addedGroupsByUnit(
  cid: number,
  prevEnd: Date,
  end: Date,
): Promise<Map<number | null, number>> {
  const groups = await prisma.courseInvite.groupBy({
    by: ['createdById'],
    where: { courseCatalogId: cid, createdAt: { gte: prevEnd, lt: end } },
    _count: { _all: true },
  })
  const keyByUser = await churchKeyByUserIds(groups.map((g) => g.createdById))
  const out = new Map<number | null, number>()
  for (const g of groups) {
    const key = keyByUser.get(g.createdById) ?? null
    out.set(key, (out.get(key) ?? 0) + g._count._all)
  }
  return out
}

// ==========================================
// 第二冊已開課單位（依建立者現況單位）
// ==========================================
async function openedUnitKeys(end: Date): Promise<Set<number | null>> {
  const rows = await prisma.courseInvite.findMany({
    where: {
      courseCatalogId: BOOK2_CATALOG_ID,
      startedAt: { not: null, lt: end },
    },
    select: { createdById: true },
    distinct: ['createdById'],
  })
  const keyByUser = await churchKeyByUserIds(rows.map((r) => r.createdById))
  return new Set(rows.map((r) => keyByUser.get(r.createdById) ?? null))
}

// ==========================================
// 世代倍增（啟動靈人師生鏈）
// ==========================================
async function generations(
  end: Date,
): Promise<{ teacherTotal: number; buckets: GenerationBucket[] }> {
  const rows = await prisma.inviteEnrollment.findMany({
    where: {
      graduatedAt: { not: null, lt: end },
      invite: { courseCatalogId: BOOK1_CATALOG_ID },
    },
    select: {
      userId: true,
      graduatedAt: true,
      invite: { select: { createdById: true } },
    },
  })

  // mentorOf：每位學員取最早結業那筆的建課者；teacherSet：所有帶過人結業者
  const mentorOf = new Map<string, { teacherId: string; at: Date }>()
  const teacherSet = new Set<string>()
  for (const r of rows) {
    teacherSet.add(r.invite.createdById)
    const at = r.graduatedAt as Date
    const cur = mentorOf.get(r.userId)
    if (!cur || at < cur.at)
      mentorOf.set(r.userId, { teacherId: r.invite.createdById, at })
  }

  const memo = new Map<string, number>()
  const gen = (t: string, seen: Set<string>): number => {
    const cached = memo.get(t)
    if (cached != null) return cached
    if (seen.has(t)) return 1 // 環路：視為第 1 代
    seen.add(t)
    const m = mentorOf.get(t)
    const g =
      !m || m.teacherId === t || !teacherSet.has(m.teacherId)
        ? 1
        : Math.min(gen(m.teacherId, seen) + 1, MAX_GEN)
    memo.set(t, g)
    return g
  }

  const counts = new Map<number, number>()
  for (const t of teacherSet) {
    const g = gen(t, new Set())
    counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  const buckets = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([generation, count]) => ({ generation, count }))
  return { teacherTotal: teacherSet.size, buckets }
}

// ==========================================
// 組列
// ==========================================
function unitName(key: number | null, nameByKey: Map<number, string>): string {
  if (key == null) return OTHER_UNIT_LABEL
  return nameByKey.get(key) ?? `（教會 #${key}）`
}

function buildBook1Units(
  cum: CumResult,
  added: Map<number | null, number>,
  nameByKey: Map<number, string>,
): UnitRow[] {
  const keys = new Set<number | null>([...cum.byUnit.keys(), ...added.keys()])
  const rows: UnitRow[] = []
  for (const key of keys) {
    const c = cum.byUnit.get(key) ?? { cum: 0, prev: 0 }
    rows.push({
      churchId: key,
      name: unitName(key, nameByKey),
      cumTotal: c.cum,
      momDelta: c.cum - c.prev,
      sharePct: cum.totalCum > 0 ? (c.cum / cum.totalCum) * 100 : 0,
      addedGroups: added.get(key) ?? 0,
    })
  }
  // 累計人數多到少；「其他／未填」固定置底
  rows.sort((a, b) => {
    if ((a.churchId == null) !== (b.churchId == null))
      return a.churchId == null ? 1 : -1
    return b.cumTotal - a.cumTotal
  })
  return rows
}

// ==========================================
// 主查詢
// ==========================================
export async function getMonthlyReport(month?: string): Promise<MonthlyReport> {
  const available = await getAvailableReportMonths()
  const normalized = normalizeMonth(month, available.map((m) => m.value))
  const { prevEnd, end } = taipeiMonthBounds(normalized)

  const [book1Cum, book2Cum, addedB1, addedB2, openedKeys, gens] =
    await Promise.all([
      bookCumulative(BOOK1_CATALOG_ID, prevEnd, end),
      bookCumulative(BOOK2_CATALOG_ID, prevEnd, end),
      addedGroupsByUnit(BOOK1_CATALOG_ID, prevEnd, end),
      addedGroupsByUnit(BOOK2_CATALOG_ID, prevEnd, end),
      openedUnitKeys(end),
      generations(end),
    ])

  // 教會 id → 名稱
  const churchIds = [
    ...new Set(
      [
        ...book1Cum.byUnit.keys(),
        ...book2Cum.byUnit.keys(),
        ...addedB1.keys(),
        ...addedB2.keys(),
        ...openedKeys,
      ].filter((k): k is number => k != null),
    ),
  ]
  const churches = churchIds.length
    ? await prisma.church.findMany({
        where: { id: { in: churchIds } },
        select: { id: true, name: true },
      })
    : []
  const nameByKey = new Map<number, string>(churches.map((c) => [c.id, c.name]))

  // 一、總體分析
  const b1Delta = book1Cum.totalCum - book1Cum.totalPrevCum
  const b2Delta = book2Cum.totalCum - book2Cum.totalPrevCum
  const book1 = {
    cumTotal: book1Cum.totalCum,
    momDelta: b1Delta,
    momRatePct:
      book1Cum.totalPrevCum > 0 ? (b1Delta / book1Cum.totalPrevCum) * 100 : null,
  }
  const book2 = {
    cumTotal: book2Cum.totalCum,
    momDelta: b2Delta,
    momRatePct:
      book2Cum.totalPrevCum > 0 ? (b2Delta / book2Cum.totalPrevCum) * 100 : null,
  }

  // 里程碑轉換率：第二冊累計 ÷ 第一冊累計中「單位屬第二冊已開課單位」的去重人數
  let denominator = 0
  for (const { key } of book1Cum.userKeys.values())
    if (openedKeys.has(key)) denominator++
  const milestone = {
    numerator: book2Cum.totalCum,
    denominator,
    ratePct: denominator > 0 ? (book2Cum.totalCum / denominator) * 100 : null,
  }

  // 三、第一冊各單位
  const book1Units = buildBook1Units(book1Cum, addedB1, nameByKey)

  // 四、第二冊各單位（限已開課單位）
  const book2Units: Book2UnitRow[] = [...openedKeys]
    .map((key) => {
      const c = book2Cum.byUnit.get(key) ?? { cum: 0, prev: 0 }
      const b1 = book1Cum.byUnit.get(key)?.cum ?? 0
      return {
        churchId: key,
        name: unitName(key, nameByKey),
        cumTotal: c.cum,
        momDelta: c.cum - c.prev,
        sharePct: book2Cum.totalCum > 0 ? (c.cum / book2Cum.totalCum) * 100 : 0,
        addedGroups: addedB2.get(key) ?? 0,
        book1CumTotal: b1,
        unitConversionPct: b1 > 0 ? (c.cum / b1) * 100 : null,
      }
    })
    .sort((a, b) => b.cumTotal - a.cumTotal)

  const b2TotalCum = book2Units.reduce((s, r) => s + r.cumTotal, 0)
  const book2UnitsTotal = {
    cumTotal: b2TotalCum,
    momDelta: book2Units.reduce((s, r) => s + r.momDelta, 0),
    addedGroups: book2Units.reduce((s, r) => s + r.addedGroups, 0),
    conversionPct: denominator > 0 ? (b2TotalCum / denominator) * 100 : null,
  }

  // 本月成長最多單位（月成長人數 > 0）
  const topMovers = {
    book1: [...book1Units]
      .sort((a, b) => b.momDelta - a.momDelta)
      .filter((r) => r.momDelta > 0)
      .slice(0, 2)
      .map((r) => ({ name: r.name, momDelta: r.momDelta })),
    book2: [...book2Units]
      .sort((a, b) => b.momDelta - a.momDelta)
      .filter((r) => r.momDelta > 0)
      .slice(0, 1)
      .map((r) => ({ name: r.name, momDelta: r.momDelta })),
  }

  return {
    month: normalized,
    monthLabel: monthLabel(normalized),
    hasData: book1Cum.totalCum > 0 || book2Cum.totalCum > 0,
    book1,
    book2,
    milestone,
    topMovers,
    generations: gens,
    book1Units,
    book2Units,
    book2UnitsTotal,
  }
}
