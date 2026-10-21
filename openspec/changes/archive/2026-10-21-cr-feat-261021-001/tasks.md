## 1. 資料層

- [x] 1.1 新檔 `lib/data/church-course-growth.ts`：
  - Taipei 時區月份邊界 helper（比照 `lib/data/monthly-report.ts` 的 `taipeiYearMonth`／`addMonths` 寫法，依本檔需求改為「年度 13 個邊界」：去年底（年初前基準）＋ 1～12 月底）。
  - `churchKeyOf(user)`／`unitName(key, nameByKey)`：比照 `monthly-report.ts` 的同名邏輯（`other`/`none` 或查無教會歸入 `null`＝「其他／未填」）。
  - `getAvailableGrowthYears(): Promise<{ value: string; label: string }[]>`：自 `InviteEnrollment.aggregate({ _min: { joinedAt: true } })` 推導最早年度至今年（Asia/Taipei），由新到舊；無資料時只回傳今年。
  - `getCourseCatalogFilterOptions(): Promise<{ id: number; label: string }[]>`：重用 `getAllCourses()`（`lib/data/course-catalog.ts`），依 `sortOrder` 排序回傳 `id`/`label`。
  - `getChurchCourseGrowth(catalogId: number, year: string): Promise<ChurchCourseGrowthReport>`：
    - 驗證並正規化 `year`（不合法或超出可選範圍 → 退回最新可選年度，比照 `monthly-report.ts` 的 `normalizeMonth`）。
    - 查詢 `InviteEnrollment.findMany({ where: { status: 'approved', joinedAt: { lt: <選定年度12月底或目前月月底> }, invite: { courseCatalogId } }, select: { userId, joinedAt, user: { churchId, churchType } } })`。
    - 依 `userId` 去重取最早 `joinedAt`（比照 `bookCumulative` 的 `userKeys` 寫法）。
    - 計算 13 個邊界（去年底 + 1~12 月底，若選定年度為今年則只算到目前月份）下，各 `churchKey` 的累計人數，推導每月 `newCount = cum[m] - cum[m-1]`。
    - 僅保留「該冊、該年度累計人數（至最後可用月份）> 0」的 `churchKey`；依累計人數由多到少排序，「其他／未填」固定置底。
    - 回傳型別：
      ```ts
      export type GrowthMonthPoint = { month: number; newCount: number; cumTotal: number }
      export type ChurchGrowthRow = {
        churchId: number | null
        name: string
        months: GrowthMonthPoint[] // 長度 = 可用月份數（今年截至目前月份，其餘年度為 12）
        yearTotal: number // 最後可用月累計 - 去年底累計
      }
      export type ChurchCourseGrowthReport = {
        year: string
        availableMonths: number // 1~12
        catalogId: number
        catalogLabel: string
        hasData: boolean
        rows: ChurchGrowthRow[] // 全部有資料的教會，含「其他/未填」
        chartChurchIds: (number | null)[] // 前 8 名 + 其他/未填（若 > 0）的 churchId 清單，供圖表篩選 rows
        overallYearTotal: number
        overallCumTotal: number // 最後可用月的全教會合計累計
      }
      ```

## 2. 頁面與元件

- [x] 2.1 新檔 `app/[locale]/(admin)/admin/analytics/church-course-growth/page.tsx`（Server Component，`export const dynamic = 'force-dynamic'`）：
  - `searchParams: Promise<{ year?: string; catalogId?: string }>`。
  - 平行取得 `getAvailableGrowthYears()`、`getCourseCatalogFilterOptions()`；`catalogId` 未指定或不合法時取選項清單第一筆；呼叫 `getChurchCourseGrowth(catalogId, year)`。
  - 渲染：頁首標題、`ChurchCourseGrowthFilters`（年度/冊別下拉）、頂部摘要卡（`overallCumTotal`／`overallYearTotal`）、`hasData` 為否時顯示空狀態文字、否則渲染 `ChurchCourseGrowthChart` 與明細表格。
- [x] 2.2 新檔 `app/[locale]/(admin)/admin/analytics/church-course-growth/church-course-growth-filters.tsx`（Client）：比照 `monthly-report-section.tsx` 的 `MonthSelect` 寫法（`usePathname`/`useRouter` from `@/i18n/navigation`），年度與冊別各一個 `<select>`，`onChange` 時 `router.push` 帶上目前兩個查詢參數（切換其中一個時保留另一個）。
- [x] 2.3 新檔 `app/[locale]/(admin)/admin/analytics/church-course-growth/church-course-growth-chart.tsx`（Client，`recharts`）：比照 `church-distribution-charts.tsx` 的 `ChartContainer`/`ChartConfig`/`ChartTooltip`/`ChartLegend` 用法，改為 `LineChart`：X 軸月份（1~`availableMonths`），每個 `chartChurchIds` 對應一條 `Line`（`dataKey` 為該教會累計人數，顏色依序取 `hsl(var(--chart-${(i % 5) + 1}))`），圖表下方/上方加一行說明文字「僅顯示累計人數前 8 名教會，完整名單見下方表格」。
- [x] 2.4 表格區塊（可直接寫在 `page.tsx` 或抽成同目錄的 `church-course-growth-table.tsx`）：逐 `rows` 列出教會名稱＋每月「新增／累計」兩欄 × `availableMonths` 個月，「其他／未填」列固定置底（`rows` 已排序，直接渲染即可）。

## 3. 後台首頁入口

- [x] 3.1 `app/[locale]/(admin)/admin/page.tsx`：`ADMIN_FEATURES` 新增：
  ```ts
  {
    title: '教會冊別成長分析',
    description: '依年度/月份檢視各教會開課學員成長趨勢',
    icon: IconChartLine, // @tabler/icons-react
    href: '/admin/analytics/church-course-growth',
    superadminOnly: false,
  }
  ```
  （需新增 `IconChartLine` import）

## 4. 操作手冊與版本號

- [x] 4.1 `doc/管理者操作手冊.md`：新增「教會冊別成長分析」小節，說明篩選條件（冊別/年度）、統計口徑（approved、去重累計、教會歸屬規則與月報一致）、圖表前 8 名限制與表格無此限制。
- [x] 4.2 `config/version.json` patch +1，`updatedAt` 更新為當日日期；同步更新手冊檔首版本標註。

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 5.2 情境：選擇啟動靈人（`courseCatalogId=1`）、本機 dev 資料庫既有資料所在年度 → 頁面累計人數與月報同年同月的對應數字一致（抽樣比對至少一個月份）。
- [x] 5.3 情境：切換到某教會跨班報名同一冊的學員情境 → 該學員只被計入一次，計入月份為較早那筆報名的月份。
- [x] 5.4 情境：選擇今年度 → 頁面只顯示至目前月份的資料，之後月份無資料點。
- [x] 5.5 情境：選擇一個尚無任何報名資料的冊別/年度組合 → 顯示空狀態文字，無報錯。
- [x] 5.6 情境：教會數量 > 8 時 → 圖表只畫 8 條線＋其他/未填，表格仍列出全部教會。
- [x] 5.7 情境：切換年度/冊別下拉 → 網址查詢參數正確更新，重新整理頁面後篩選狀態不丟失。
- [x] 5.8 從 `/admin` 首頁點擊「教會冊別成長分析」卡片 → 正確導向本頁。

  使用者於本機 `make dev` 環境實際瀏覽器操作確認無誤。
