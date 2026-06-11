## Context

後台儀錶板 `/admin/dashboard` 目前由 `lib/data/dashboard.ts` 提供統計與圖表資料，頁面 `app/(user)/admin/dashboard/page.tsx` 渲染 4 張統計卡片與 2 張 BarChart（`dashboard-charts.tsx`）。「講師資格」現以「結業該課程」單一條件認定，未檢查 `teacher` 身分。本變更調整統計卡片並移除圖表區塊。

> 註：`admin-dashboard` 能力的基準 spec 僅存在於 archive（`cr-spec-260403-005`），未同步至 `openspec/specs/`，故本次 delta 以 `ADDED` 重新確立能力最終狀態。

## Goals / Non-Goals

**Goals:**
- 統計卡片擴充為 6 張，並校正講師資格定義為「`teacher` 身分 AND 結業該課程」。
- 新增「開課中課程總數」「已結業課程總數」。
- 移除課程活動統計圖表（含時間區間切換），儀錶板僅保留卡片。

**Non-Goals:**
- 不修改 DB schema。
- 不調整 `User.roles`、`CourseInvite`、`InviteEnrollment`、`CourseCatalog` 既有結構。
- 不處理圖表的替代視覺化（純移除）。

## Decisions

### 1. 講師資格採「身分 AND 結業」且嚴格限 `teacher`
查詢條件：`InviteEnrollment` 中 `graduatedAt IS NOT NULL` 且 `invite.courseCatalogId = N`，再要求 `user.roles` 含 `teacher`，去重 `userId` 後計數。
- 以 `prisma.user.count({ where: { roles: { has: 'teacher' }, inviteEnrollments: { some: { graduatedAt: { not: null }, invite: { courseCatalogId: N } } } } })` 一次查詢，天然去重。
- `admin`/`superadmin` 未加掛 `teacher` 不計入（依使用者確認）。

### 2. 課程狀態計數沿用既有 `CourseInvite` 旗標語意
- 開課中（招生中）：`startedAt IS NULL AND cancelledAt IS NULL AND completedAt IS NULL`
- 進行中：`startedAt IS NOT NULL AND cancelledAt IS NULL AND completedAt IS NULL`
- 已結業：`completedAt IS NOT NULL`

### 3. 移除圖表相關程式碼
- 刪除 `dashboard-charts.tsx`。
- 自 `lib/data/dashboard.ts` 移除 `getCourseStartStats()`、`getGraduationStats()`、`CourseStatItem`。
- 頁面移除 `?range=` searchParams、`Range`/`RANGE_*` 常數與圖表區塊。

### 4. 卡片網格 RWD
6 張卡片改用 `grid-cols-2 lg:grid-cols-3`（小螢幕 2 欄、大螢幕 3 欄）。

## Risks / Trade-offs

- **移除圖表為破壞性 UI 變更**：管理者將失去趨勢視覺化。經使用者明確要求「先取消」，可日後再以新需求重建。
- **講師資格數字下降**：新定義較嚴格，數字會比現況小，屬預期且正確的行為校正。
- 計數查詢為多次 `count`，資料量小無效能疑慮。
