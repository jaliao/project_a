## Context

目前 `/course-sessions` 僅顯示當前登入者建立的開課，且連結從後台首頁「授課管理」卡片進入。
此 CR 在 `/admin/course-sessions` 新增一個後台專屬頁面，顯示全站所有開課，並提供搜尋篩選功能。
原 `/course-sessions` 頁面保留不動（使用者個人授課頁）。

**現有可重用元件：**
- `CourseSessionCard`（compact/full variant，含 href 連結）

## Goals / Non-Goals

**Goals:**
- 新增 `/admin/course-sessions` 後台頁，admin/superadmin 可見所有開課
- 顯示總筆數，預設取最新 30 筆，按 courseDate desc（null 排最後）
- 文字搜尋（`?q=`）：跨課程名稱、講師姓名、學員姓名
- 下拉篩選：課程名稱（catalogId）、進度（status）、開課日期區間（startDate/endDate）
- 點擊卡片以 `target="_blank"` 另開視窗
- 後台首頁「授課管理」卡片連結改為 `/admin/course-sessions`

**Non-Goals:**
- 分頁（pagination）— 本 CR 僅取前 30 筆
- 後台內嵌課程詳情 — 另開視窗沿用現有 `/course/[id]` 頁面
- 修改原 `/course-sessions` 頁面

## Decisions

**路由：`/admin/course-sessions`（新增，不影響現有路由）**
- Server Component 讀取 `searchParams` 傳篩選條件給 data layer
- 篩選列為 Client Component（`CourseSessionsFilter`），以 `router.push` 更新 URL params

**資料查詢：`getAllCourseSessionsAdmin(params)` in `lib/data/course-sessions.ts`**
- 回傳 `{ total: number, items: CourseSessionItem[] }`
- `take: 30`，`orderBy: courseDate desc nulls last`（Prisma `sort: 'last'`）
- 文字搜尋 `q`：Prisma OR 條件 — `title contains`、`createdBy.name/realName contains`、`enrollments.some.user.name/realName contains`
- 篩選 `catalogId`：`where: { courseCatalogId: catalogId }`
- 篩選 `status`：轉換為 Prisma null 條件（cancelled/completed/started/recruiting）
- 篩選日期區間：`courseDate gte/lte`（字串比較，ISO 格式）

**`CourseSessionCard` 另開視窗支援**
- 新增可選 prop `newTab?: boolean`，card 包裝從 `<Link>` 改為 `<a target="_blank" rel="noopener noreferrer">`
- 不改變現有呼叫方（不傳 newTab 時行為不變）

**狀態（status）對應 Prisma where：**
- `cancelled`：`cancelledAt: { not: null }`
- `completed`：`cancelledAt: null, completedAt: { not: null }`
- `started`：`cancelledAt: null, completedAt: null, startedAt: { not: null }`
- `recruiting`：`cancelledAt: null, completedAt: null, startedAt: null`

## Risks / Trade-offs

- [學員姓名搜尋需 join enrollments → user] → 接受，30 筆限制降低效能影響；若資料量大可改全文搜尋
- [courseDate 為字串欄位，排序以字串比較] → 接受，ISO 格式字串排序與日期排序等效
- [courseDate null 排在最後] → Prisma `{ sort: 'last' }` 處理
