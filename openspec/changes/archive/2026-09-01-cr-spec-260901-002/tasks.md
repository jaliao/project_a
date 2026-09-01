# Tasks — 儀表板月報區塊（cr-spec-260901-002）

## 1. 資料層 `lib/data/monthly-report.ts`

- [x] 1.1 建立新檔，加標準檔頭註解；定義常數 `BOOK1_CATALOG_ID = 1`、`BOOK2_CATALOG_ID = 2`、`MAX_GEN = 10`、時區 `Asia/Taipei`。
- [x] 1.2 內部工具 `taipeiMonthBounds(month: 'YYYY-MM') → { prevEnd: Date; end: Date }`：以 Asia/Taipei 民用月換算 UTC 邊界（優先沿用 `lib/utils` 既有日期工具，若無則就地實作）。
- [x] 1.3 `getAvailableReportMonths()`：查 `min(InviteEnrollment.joinedAt)`，產生「最早月 ~ 今日所在月（Asia/Taipei）」由新到舊清單，每項 `{ value: 'YYYY-MM', label: 'YYYY 年 M 月' }`；無報名時只回當月。
- [x] 1.4 `normalizeMonth(month?)`：驗證格式與範圍，不合法 → 回「今日所在月的前一個完整月份」。
- [x] 1.5 累計人數推導 `bookCumulative(cid, prevEnd, end)`：單次查 `inviteEnrollment`（`status:'approved'`, `invite.courseCatalogId:cid`, `joinedAt < end`），`select` `userId` 與 `user.{churchId,churchType}` 及 `joinedAt`；於應用層收斂為「每 userId 最早 joinedAt ＋ churchKey」，再算出全體與逐單位的 `cumTotal`（`< end`）、`prevCumTotal`（`< prevEnd`）。`churchKey = churchType==='church' ? churchId : null`。
- [x] 1.6 增加組數 `addedGroupsByUnit(cid, prevEnd, end)`：`courseInvite.groupBy(by:['createdById'], where:{courseCatalogId:cid, createdAt:{gte:prevEnd, lt:end}})`；一次 `user.findMany` 對照 `createdById → churchKey`，彙整到單位。
- [x] 1.7 第二冊已開課單位 `openedUnitKeys(end)`：`courseInvite.findMany(where:{courseCatalogId:2, startedAt:{not:null, lt:end}}, distinct:['createdById'])` → 對照 `churchKey` 成 `Set<number|null>`。
- [x] 1.8 里程碑 `milestone`：分子＝第二冊 `cumTotal`；分母＝第一冊累計（`< end`）中 `churchKey ∈ openedUnitKeys` 的去重人數；`ratePct = 分母>0 ? 分子/分母*100 : null`。
- [x] 1.9 世代推導 `generations(end)`：單次查啟動靈人已結業報名（`graduatedAt:{not:null, lt:end}`, `invite.courseCatalogId:1`, select `userId,graduatedAt,invite.createdById`）；建 `mentorOf`（每 userId 取最早 graduatedAt 的 `createdById`）、`teacherSet`（所有 `createdById`）；`gen(t)` 遞迴 + memo + `seen` 環路防護 + `MAX_GEN` 截斷；統計 `buckets:[{generation,count}]`（generation 由小到大）與 `teacherTotal = teacherSet.size`。
- [x] 1.10 `book1Units` / `book2Units`：組 `UnitRow` / `Book2UnitRow`；教會 id→name 以一次 `church.findMany` 對照，`churchKey=null` 顯示「其他／未填」；`book1Units` 依 `cumTotal` desc、「其他／未填」置底；`book2Units` 僅 `openedUnitKeys`、依 `cumTotal` desc；`book2UnitsTotal` 彙總 + `conversionPct = milestone.denominator>0 ? total.cumTotal/denominator*100 : null`。
- [x] 1.11 `topMovers`：`book1Units` 依 `momDelta` desc 取前 2、`book2Units` 取前 1，`momDelta>0` 才列。
- [x] 1.12 `getMonthlyReport(month?)`：組出完整 `MonthlyReport`（含 `month`、`monthLabel`）；以 `Promise.all` 併發各查詢。匯出型別 `MonthlyReport`、`UnitRow`、`Book2UnitRow`、`GenerationBucket`。

## 2. UI

- [x] 2.1 新檔 `app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx`：標準檔頭；預設 export `MonthlyReportSection({ report, months })`（server 呈現元件）。
- [x] 2.2 內部 `MonthSelect`（`'use client'`）：原生 `<select>`，`value={report.month}`，`onChange` 以 `@/i18n/navigation` 的 `useRouter` + `usePathname` 導向 `?month=<value>`。
- [x] 2.3 區塊容器：標題列「月報」＋右側 `MonthSelect`；沿用既有 `Section` / `StatCard` 樣式基調。
- [x] 2.4 總體分析：三張卡（第一冊累計、第二冊累計、里程碑轉換率），主數字下顯示 `+N 人（+X%）`，率為 `null` 顯示「—」；里程碑卡註記「分子 ÷ 分母」；下方說明列 `topMovers`。
- [x] 2.5 世代倍增：「共 N 位教師」＋各代一列人數（純 CSS 長條或 `components/ui/chart` 水平 bar；資料量小優先純 CSS）。
- [x] 2.6 第一冊各單位表：欄 單位／累計總人數／月成長人數／人數佔比（含 `width:{sharePct}%` 長條）／增加組數；`cumTotal` desc、「其他／未填」置底。
- [x] 2.7 第二冊各單位表：欄 單位／累計總人數／月成長人數／增加組數／佔第一冊比（`137 / 817人　16.8%`）＋「總計」列與整體轉換率。
- [x] 2.8 空狀態：卡顯示 0／「—」，表格顯示「本月無資料」列，不丟錯。
- [x] 2.9 文字全繁體硬字串；數字 `toLocaleString()`。

## 3. 頁面接線 `app/[locale]/(admin)/admin/dashboard/page.tsx`

- [x] 3.1 簽名改為接 `searchParams: Promise<{ month?: string }>` 並 `await`（Next 16）。
- [x] 3.2 `Promise.all([getDashboardStats(), getMonthlyReport(month), getAvailableReportMonths()])`。
- [x] 3.3 於「課程分析」`</Section>` 之後渲染 `<MonthlyReportSection report={report} months={months} />`。
- [x] 3.4 確認 `export const dynamic = 'force-dynamic'` 仍在；更新檔頭 `Updated` 日期。

## 4. 驗證

- [x] 4.1 `npm run lint`、`npm run build` 通過。
- [x] 4.2 手動：`/admin/dashboard` 顯示月報區塊，預設為上一個完整月份；切換月份網址變 `?month=YYYY-MM` 且數字重算。
- [x] 4.3 手動：`?month=abc`、`?month=2099-13` → 回退上一個完整月份、不報錯。
- [x] 4.4 手動：選一個早於所有報名的月份 → 0／「—」／「本月無資料」，無錯誤。
- [x] 4.5 手算核對一個月份：任取某教會，用 DB 查該教會第一冊 approved 去重人數（`joinedAt < 次月1日`）與月報「累計總人數」一致；「人數佔比」各單位加總 = 100%。
- [x] 4.6 手算核對里程碑：第二冊累計 ÷（第一冊累計中屬第二冊已開課單位者）與卡片一致。
- [x] 4.7 世代：抽查一名教師的最早啟動靈人結業課建立者，確認世代 = mentor 世代 + 1；無 mentor / mentor 非教師者為第 1 代。

## 5. 文件與版本號

- [x] 5.1 `doc/管理者操作手冊.md`：儀表板章節新增「月報」小節（四子區塊、月份切換、各數字口徑摘要）；更新檔首版本與日期。
- [x] 5.2 `doc/老師手冊.md`／`doc/學員手冊.md`：不涉及（純後台），不修改。
- [x] 5.3 `config/version.json`：patch +1、`updatedAt` 改當日。
- [x] 5.4 `ai-context/03-architecture.md`：`lib/data/` 補 `monthly-report.ts`、`/admin/dashboard` 說明補月報區塊與 `?month=` 參數。
- [x] 5.5 `ai-context/07-current-tasks.md`：「已完成」清單最前面追加本 CR。
- [x] 5.6 `README-AI.md`：版本行同步（若版本號變動）。
