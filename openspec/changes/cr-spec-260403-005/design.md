## Context

後台「儀錶板」卡片目前標示「待開發」（href: null）。
recharts 已安裝（^2.15.4）。CourseCatalog 有固定幾筆（啟動靈人 id=1、啟動豐盛 id=2 等），圖表以 catalog label 為分組 key。

## Goals / Non-Goals

**Goals:**
- 新增 `/admin/dashboard` 頁面：4 個統計卡片 + 2 個 BarChart
- 統計卡片：總學員數、啟動靈人資格講師數、啟動豐盛資格講師數、進行中課程總數
- BarChart × 2：「開始上課」與「順利結業」，各依 CourseCatalog 分組，支援 3 個月 / 30 天 / 7 天時間區間切換
- 時間區間切換以 URL `?range=` 控制（`3m` / `30d` / `7d`，預設 `30d`）
- 後台首頁「儀錶板」卡片啟用（href 改為 `/admin/dashboard`，移除「待開發」badge）

**Non-Goals:**
- 即時更新 / WebSocket
- 自訂日期範圍
- 圖表匯出

## Decisions

**頁面架構：Server Component + Client Chart 元件**
- `page.tsx`（Server Component）：讀 `searchParams.range`、呼叫 data layer、傳資料給 `DashboardCharts`
- `dashboard-charts.tsx`（Client Component）：recharts `BarChart`，接收 `startStats` / `graduationStats` / `range` props，渲染兩組圖表 + 時間區間切換按鈕（router.push `?range=...`）

**Data Layer：`lib/data/dashboard.ts`**
- `getDashboardStats()` → `{ totalMembers, spiritInstructors, richInstructors, activeCourseSessions }`
  - `totalMembers`: `prisma.user.count()`
  - `spiritInstructors`: `prisma.inviteEnrollment.findMany({ where: { graduatedAt: { not: null }, invite: { courseCatalogId: 1 } }, distinct: ['userId'] })` → `.length`
  - `richInstructors`: 同上 `courseCatalogId: 2`
  - `activeCourseSessions`: `prisma.courseInvite.count({ where: { startedAt: { not: null }, cancelledAt: null, completedAt: null } })`
- `getCourseStartStats(days)` → `{ catalogId, label, count }[]`
  - 查 `CourseInvite` where `startedAt >= now - days`，groupBy `courseCatalogId`，join catalog label
- `getGraduationStats(days)` → `{ catalogId, label, count }[]`
  - 查 `InviteEnrollment` where `graduatedAt >= now - days`，groupBy `invite.courseCatalogId`，join catalog label

**圖表設計**
- recharts `BarChart` + `Bar` + `XAxis` + `YAxis` + `Tooltip` + `Legend`
- X 軸：CourseCatalog label
- Y 軸：數量
- 各 catalog 一個 Bar，顏色對應 `getCatalogColor(id)` 規則（與 CourseSessionCard 一致）
- 時間切換：3 個 Button（3個月 / 30天 / 7天），active 狀態標示

**Prisma groupBy 替代方案**
- Prisma `groupBy` 不支援 relation join，改用 `findMany` + JS reduce 分組，資料量小（CourseCatalog 數量有限）可接受

## Risks / Trade-offs

- [catalogId 硬編碼 1/2] → 改為動態查詢所有 catalog，資料更彈性
- [BarChart X 軸只有 catalog label，不含時間趨勢] → 接受，需求為「時間區間內各課程的總量比較」，非時序趨勢
