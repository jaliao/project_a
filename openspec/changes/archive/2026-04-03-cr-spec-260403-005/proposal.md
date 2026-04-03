## Why

後台首頁「儀錶板」功能卡片目前標示「待開發」，管理者無法快速掌握系統整體狀況。
本 CR 建立 `/admin/dashboard` 頁面，提供關鍵統計數據與課程活動圖表。

## What Changes

- 新增 `app/(user)/admin/dashboard/page.tsx`（Server Component）：後台儀錶板頁面
- 新增統計數據區塊：總學員數、啟動靈人資格講師數、啟動豐盛資格講師數、目前進行中課程總數（仿 shadcn dashboard 卡片設計）
- 新增「開始上課趨勢」圖表：依課程類別分組的 BarChart，可切換時間區間（3個月 / 30天 / 7天）
- 新增「順利結業趨勢」圖表：依課程類別分組的 BarChart，可切換時間區間（3個月 / 30天 / 7天）
- 圖表時間區間切換以 URL `?range=` 參數控制
- `lib/data/dashboard.ts`：新增 `getDashboardStats()`、`getCourseStartStats(days)`、`getGraduationStats(days)` 三個查詢
- `app/(user)/admin/page.tsx`：「儀錶板」卡片連結改為 `/admin/dashboard`，移除「待開發」badge

## Capabilities

### New Capabilities
- `admin-dashboard`：後台儀錶板頁面，含統計卡片（學員數、講師數）與兩組課程活動 BarChart（時間區間切換）

### Modified Capabilities
（無）

## Impact

- `app/(user)/admin/dashboard/page.tsx` — 新增（Server Component）
- `app/(user)/admin/dashboard/dashboard-charts.tsx` — 新增（Client Component，recharts BarChart）
- `lib/data/dashboard.ts` — 新增 data layer
- `app/(user)/admin/page.tsx` — 更新儀錶板卡片連結與 badge
- 依賴：`recharts`（已安裝）

## 資料定義

**總學員數**：`User` 總數（含所有 role）
**啟動靈人資格講師數**：至少有一筆 `InviteEnrollment.graduatedAt IS NOT NULL` 且 `courseCatalog.id = 1` 的不重複 User 數
**啟動豐盛資格講師數**：至少有一筆 `InviteEnrollment.graduatedAt IS NOT NULL` 且 `courseCatalog.id = 2` 的不重複 User 數
**目前進行中課程總數**：`CourseInvite` 中 `startedAt IS NOT NULL AND cancelledAt IS NULL AND completedAt IS NULL` 的筆數

**開始上課**：`CourseInvite.startedAt` 落在時間區間內，依 `courseCatalogId` 分組計數
**順利結業**：`InviteEnrollment.graduatedAt` 落在時間區間內，依 `courseInvite.courseCatalogId` 分組計數
