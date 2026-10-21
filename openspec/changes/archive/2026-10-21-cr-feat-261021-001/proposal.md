## Why

後台目前只有「月報」（`lib/data/monthly-report.ts`）能看到單一月份（本月 vs 上月）第一冊（啟動靈人）、第二冊（啟動豐盛）兩冊的各教會累計人數，無法：
1. 看超過兩冊的其他冊別（如啟動得勝，`courseCatalogId = 3` 及未來新增的冊）。
2. 看一整年度、每個月的成長曲線——月報只比較「這個月」與「上個月」，看不出一年內的趨勢走向。

管理者需要能挑一冊、挑一個年度，看各教會在該年度每個月的開課學員累計成長趨勢，評估各教會推動進度與季節性落差。

## What Changes

- 後台新增獨立分析頁面 `/admin/analytics/church-course-growth`：
  - **篩選**：冊別（`CourseCatalog`，含未啟用但曾開課過的冊）、年度（依最早一筆報名年度至今年）。
  - **統計基礎**：比照現有「月報」慣例——以 `InviteEnrollment.status = 'approved'` 且 `joinedAt` 落在範圍內為計算依據，同一學員在同一冊僅計入最早一次核准報名時間（跨班不重複計），依學員現況所屬教會（`User.churchId`/`churchType`）歸屬；非清單教會（`other`/`none`）彙總為「其他／未填」。
  - **呈現**：
    - 頂部摘要卡：該冊、該年度全教會合計累計人數與本年度新增人數。
    - 折線圖：X 軸為 1～12 月（選擇當年度時只畫到目前月份），Y 軸為累計人數；每條線代表一個教會，為避免圖表過度擁擠，僅畫出該冊累計人數最高的前 8 個教會＋「其他／未填」彙總，其餘教會不畫線但仍列在下方表格。
    - 表格：逐教會列出 1～12 月每月的「月增人數」與「累計人數」，不受前 8 名限制，全部教會（含未上榜的）都列出；「其他／未填」固定置底。
  - 後台首頁（`/admin`）功能卡新增一張「教會冊別成長分析」導向此頁。

## Capabilities

### Added Capabilities

- `admin-church-course-growth-analytics`：後台「各教會各冊開課學員成長分析」頁面（年度 × 月份折線圖＋表格）。

## Impact

- **新檔** `lib/data/church-course-growth.ts`：推導邏輯，比照 `lib/data/monthly-report.ts` 的 Taipei 時區月份邊界與「去重累計」寫法，但推廣為任意冊別、一整年 12 個月的累計序列。
- **新檔** `app/[locale]/(admin)/admin/analytics/church-course-growth/page.tsx`（Server Component）、`church-course-growth-filters.tsx`（Client，冊別/年度下拉）、`church-course-growth-chart.tsx`（Client，`recharts` 折線圖，比照 `church-distribution-charts.tsx` 的 `ChartContainer` 用法）。
- **修改** `app/[locale]/(admin)/admin/page.tsx`：`ADMIN_FEATURES` 新增一張功能卡。
- **不需要**資料庫 schema 變更（純讀取既有 `InviteEnrollment`／`CourseInvite`／`Church`／`CourseCatalog`／`User` 資料）。
- **操作手冊**：`doc/管理者操作手冊.md` 新增此頁說明。
- **版本號**：`config/version.json` patch +1。
