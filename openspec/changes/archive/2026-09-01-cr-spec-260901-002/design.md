# Design — 儀表板月報區塊（cr-spec-260901-002）

## 背景與目標

把 `doc/啟動8月月報.pdf` 的四塊資訊搬進 `/admin/dashboard`，並支援按月切換。既有 `doc` 是**人工彙整**的，本設計以系統既有時間戳即時推導，數字與 PDF 可能有小幅差異（歸屬口徑、教師集合定義），屬預期。

## 一、月份模型與邊界

- 對外參數 `month`：字串 `YYYY-MM`。UI 以 `<select>` 提供、寫入 `?month=`。
- 時區固定 `Asia/Taipei`（事工在台灣）。DB 存 UTC，計算時以 Asia/Taipei 民用月邊界換算成 `Date`：
  - `asOfPrevEnd` = 所選月 1 日 00:00（+08:00）
  - `asOfEnd` = 次月 1 日 00:00（+08:00）
- 「累計至 T」一律用 `< T`（排除上界）。「本月新增」用 `[asOfPrevEnd, asOfEnd)`。
- `month` 省略／格式錯／超出可選範圍 → fallback 為「今天（Asia/Taipei）所在月的前一個月」。
- 可選月份範圍：`min(InviteEnrollment.joinedAt)` 所在月 ~ 今天所在月，由新到舊。無任何報名資料時只回傳當月。

實作可用小工具（放 `lib/data/monthly-report.ts` 內部，不外開）：
```
function taipeiMonthBounds(month: string): { prevEnd: Date; end: Date }
```
以 `new Date(Date.UTC(y, m-1, 1) - 8*3600_000)` 之類方式取得對應 UTC 瞬間，或用既有日期工具（若 `lib/utils` 已有 tz helper 優先沿用）。

## 二、資料層 API（`lib/data/monthly-report.ts`）

```ts
export const BOOK1_CATALOG_ID = 1 // 啟動靈人（第一冊）
export const BOOK2_CATALOG_ID = 2 // 啟動豐盛（第二冊）

export type UnitRow = {
  churchId: number | null      // null = 「其他／未填」彙總列
  name: string                 // 教會名稱 or 「其他／未填」
  cumTotal: number             // 累計至 asOfEnd 的去重人數
  momDelta: number             // 累計至 asOfEnd − 累計至 asOfPrevEnd
  sharePct: number             // cumTotal ÷ 該冊全體 cumTotal（0~100）
  addedGroups: number          // 本月新增 CourseInvite 數（依建立者單位）
}

export type Book2UnitRow = UnitRow & {
  book1CumTotal: number        // 同一單位第一冊累計（分母）
  unitConversionPct: number | null // book2 cumTotal ÷ book1CumTotal（分母 0 → null）
}

export type GenerationBucket = { generation: number; count: number }

export type MonthlyReport = {
  month: string                // 正規化後的 YYYY-MM
  monthLabel: string           // 「2026 年 8 月」
  // 總體分析
  book1: { cumTotal: number; momDelta: number; momRatePct: number | null }
  book2: { cumTotal: number; momDelta: number; momRatePct: number | null }
  milestone: {
    numerator: number          // book2 cumTotal
    denominator: number        // 第一冊累計中「單位屬第二冊已開課單位」的去重人數
    ratePct: number | null
  }
  topMovers: {
    book1: { name: string; momDelta: number }[] // 取月成長人數前 2
    book2: { name: string; momDelta: number }[] // 取前 1
  }
  // 世代倍增
  generations: {
    teacherTotal: number
    buckets: GenerationBucket[] // generation 1..N，count 由多至少或依 generation 遞增（UI 決定）
  }
  // 各單位
  book1Units: UnitRow[]         // 依 cumTotal desc
  book2Units: Book2UnitRow[]    // 限已開課單位，依 cumTotal desc
  book2UnitsTotal: {            // 「總計」列
    cumTotal: number; momDelta: number; addedGroups: number; conversionPct: number | null
  }
}

export async function getMonthlyReport(month?: string): Promise<MonthlyReport>
export async function getAvailableReportMonths(): Promise<{ value: string; label: string }[]>
```

### 2.1 累計參與人數（去重）

某冊「累計至 T」：
```
prisma.inviteEnrollment.findMany({
  where: { status: 'approved', joinedAt: { lt: T }, invite: { courseCatalogId: cid } },
  select: { userId: true, user: { select: { churchId: true, churchType: true } } },
  distinct: ['userId'],            // 或應用層 Set 去重
})
```
- 一次查 `asOfEnd` 全量、一次查 `asOfPrevEnd` 全量（或查 `asOfEnd` 全量並帶 `joinedAt`，於應用層切兩個時點——**較省**：單一查詢帶 `joinedAt`，同時算出 `cumTotal` 與 `prevCumTotal`、逐單位分組）。
- 逐單位：以 `user.churchType === 'church' ? user.churchId : null` 為 key（null 代表「其他／未填」），對「首次出現該 userId」計數（`joinedAt` 取該 user 在該冊最早的 approved 報名時間，避免重複計）。
  - 實作：先把 rows 依 `userId` 收斂成「該 user 在該冊最早 joinedAt ＋ 其 churchKey」，再依 `earliestJoinedAt < asOfEnd` / `< asOfPrevEnd` 分別累加。

### 2.2 增加組數

```
prisma.courseInvite.groupBy({
  by: ['createdById'],
  where: { courseCatalogId: cid, createdAt: { gte: asOfPrevEnd, lt: asOfEnd } },
  _count: { _all: true },
})
```
再把 `createdById → 該 user 目前 churchId/churchType` 對照（一次 `user.findMany`），彙整到單位 key。

### 2.3 第二冊已開課單位

```
prisma.courseInvite.findMany({
  where: { courseCatalogId: BOOK2_CATALOG_ID, startedAt: { not: null, lt: asOfEnd } },
  select: { createdById: true },
  distinct: ['createdById'],
})
```
→ 對照建立者的 `churchKey` 得「已開課單位集合」`openedUnitKeys: Set<number|null>`。

- `milestone.denominator` = 第一冊「累計至 asOfEnd」中，`churchKey ∈ openedUnitKeys` 的去重人數。
- `book2Units` = `openedUnitKeys` 中每個單位一列（即使該單位第二冊 cumTotal 為 0 也列，與 PDF 一致）。

### 2.4 世代倍增（師生鏈）

單次查詢載入啟動靈人所有「已結業」報名：
```
prisma.inviteEnrollment.findMany({
  where: { graduatedAt: { not: null, lt: asOfEnd }, invite: { courseCatalogId: BOOK1_CATALOG_ID } },
  select: { userId: true, graduatedAt: true, invite: { select: { createdById: true } } },
})
```
在記憶體：
1. `mentorOf: Map<studentId, teacherId>`：對每個 `userId` 取 `graduatedAt` 最早那筆的 `invite.createdById`。
2. `teacherSet: Set<teacherId>` = 所有出現過的 `invite.createdById`（＝有帶過人結業者）。
3. `generation(t)`：
   ```
   function gen(t, seen = new Set()):
     if seen.has(t): return 1            // 環路防護
     seen.add(t)
     const m = mentorOf.get(t)
     if （m == null || !teacherSet.has(m)）: return 1
     return Math.min(gen(m, seen) + 1, MAX_GEN)   // MAX_GEN = 10
   ```
   加 memo（`Map<teacherId, number>`）避免重算。
4. 統計 `buckets`：對 `teacherSet` 每個 t 取 `gen(t)`，計數；`teacherTotal = teacherSet.size`。

> 注意：`mentorOf` 只在「student 本身也在 teacherSet」時才需要它的 generation；非教師的 student 不納入 buckets。

### 2.5 topMovers

`book1Units` / `book2Units` 依 `momDelta` desc 取前 N（book1 取 2、book2 取 1），只回 `{ name, momDelta }`。`momDelta <= 0` 者仍可顯示（與 PDF 相符：PDF 只列有成長者，UI 可過濾 `> 0`）。

## 三、UI 設計

### 3.1 頁面接線（`page.tsx`）

```tsx
export default async function AdminDashboardPage({
  searchParams,
}: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams
  const [stats, report, months] = await Promise.all([
    getDashboardStats(),
    getMonthlyReport(month),
    getAvailableReportMonths(),
  ])
  // ...既有三區塊不變...
  // 新增：<MonthlyReportSection report={report} months={months} />
}
```
- Next 16：`searchParams` 為 Promise，需 `await`。
- 既有 `export const dynamic = 'force-dynamic'` 保留（本就存在）。

### 3.2 `monthly-report-section.tsx`

- 預設 export `MonthlyReportSection`（server 元件，純呈現）＋內部 `MonthSelect`（`'use client'`）。
- `MonthSelect`：
  ```tsx
  'use client'
  import { useRouter, usePathname } from '@/i18n/navigation'
  // <select value={report.month} onChange={e => router.push(`${pathname}?month=${e.target.value}`)}>
  ```
  用原生 `<select>` 即可（後台、繁體硬字串），不需引 Radix Select。
- 版面：沿用既有 `Section`（`h2` + grid）與 `StatCard` 風格；月報自帶一個帶標題列（標題「月報」＋右側 `MonthSelect`）的容器。
- **總體分析**：三張卡。卡片延伸樣式：主數字下方一行 `+107 人（+7.2%）`，成長率為 `null` 時顯示「—」。里程碑卡副標顯示 `172 ÷ 1,072`。
- **世代倍增**：`共 N 位教師` 標題 ＋ 每代一列：`第 K 代　XX 人`，以 `recharts` 水平 `BarChart` 或純 `div` 長條（比照 `church-distribution-charts` 的 `ChartContainer` 用法；量小可用純 CSS 長條，避免過度）。
- **第一冊各單位表**：`<table>`（後台既有表格樣式類別），欄：單位／累計總人數／月成長人數／人數佔比／增加組數；「人數佔比」欄內含一條背景長條（`width: {sharePct}%`）＋百分比文字。列序 `cumTotal` desc。「其他／未填」列固定排最後。
- **第二冊各單位表**：欄：單位／累計總人數／月成長人數／增加組數／佔第一冊比（`137 / 817人　16.8%`）；末列「總計」＋整體轉換率 `16%`。
- 全部文字繁體硬字串。數字 `toLocaleString()`。

### 3.3 空狀態

- 選到「沒有任何資料」的月份：卡片顯示 0 / —，表格顯示「本月無資料」列，不報錯。
- 無可選月份（系統無報名）：`MonthSelect` 只有當月一項，區塊照常顯示 0。

## 四、不做什麼（Non-goals）

- 不新增快照表、不建 cron、不做 Excel 匯出（本 CR 僅頁面呈現）。
- 不改 `admin-dashboard` 既有三區塊。
- 不做世代「樹狀圖」視覺化，只做各代人數。
- 不處理 `User` 教會異動歷史（採現況歸屬）。
- 不加 i18n key（後台維持繁體）。

## 五、風險

| 風險 | 緩解 |
|---|---|
| 數字與人工 PDF 對不齊 | proposal「Open Questions」已載明口徑；spec 用明確定義，對帳差異視為預期 |
| 世代鏈有環／資料髒 | `gen()` 內建 `seen` 環路防護與 `MAX_GEN` 上限 |
| 大量報名資料時查詢慢 | 單頁 admin 載入、可接受；世代與累計皆單次查詢 + 記憶體彙整 |
| 時區換算錯誤導致跨月歸錯 | 邊界集中在 `taipeiMonthBounds`，加單元層級的手算驗證（見 tasks 驗收） |
