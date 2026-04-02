## Context

目前 `/admin/members/[id]` 以兩個獨立表格顯示學習紀錄與授課紀錄，但無法呈現「師生傳承」的完整脈絡。

師生關係的資料源：
- **老師**：某個 `CourseInvite`（`courseCatalogId = 1`，即「啟動靈人」）的 `createdById`，且該會員有 `InviteEnrollment.graduatedAt IS NOT NULL` 的記錄
- **學生**：此會員所建立之「啟動靈人」`CourseInvite` 的 `InviteEnrollment`，且 `graduatedAt IS NOT NULL`

遞迴向下展開 N 層學生形成完整師生樹。

## Goals / Non-Goals

**Goals:**
- 在會員詳情頁以 Tabs UI 切換「基本資料 / 學習階層」分頁
- 顯示：此會員的老師（向上 1 層）、學生清單（向下 N 層，N 預設 3）
- N 儲存於 `AdminSetting` 表，可由 superadmin 在 `/admin/settings` 調整
- 階層查詢使用迭代 BFS（廣度優先），避免遞迴 N+1 查詢

**Non-Goals:**
- 不支援跨課程目錄（僅限「啟動靈人」`courseCatalogId = 1`）
- 不顯示未結業學員
- 不支援即時編輯階層關係
- `/admin/settings` 初期只支援 `hierarchy_depth` 一個設定鍵

## Decisions

### 1. 階層查詢：BFS 迭代式，非遞迴 SQL

**選擇**：在應用層以 BFS 迭代展開，每層做一次 `findMany`，最多 N 次 DB 查詢。

**理由**：PostgreSQL 的 `WITH RECURSIVE` 雖然更有效率，但 Prisma 不直接支援，需用 `$queryRaw`（型別不安全、維護難）。N 預設 3 且組織規模有限（每層通常不超過 30 人），BFS 最多 3 次查詢，可接受。

**替代方案**：Prisma `$queryRaw` 遞迴 CTE → 效能更佳但維護成本高，暫不採用。

### 2. AdminSetting 模型：key/value store

**選擇**：建立 `AdminSetting` 模型，欄位 `key String @unique`, `value String`，型別轉換由應用層處理。

**理由**：彈性擴充未來設定鍵，且不需要多型欄位。`hierarchy_depth` 以字串儲存，讀取時 `parseInt`。

**替代方案**：直接寫在 `.env` → 無法在後台 UI 動態調整，不符合需求。

### 3. Tabs 實作：Server Component 外層 + Client Tabs

**選擇**：`/admin/members/[id]/page.tsx` 維持 Server Component，在 JSX 中使用 shadcn `Tabs`（client component），`MemberHierarchyTree` 為獨立 Server Component 接收 `userId` 與 `depth` props。

**理由**：Tabs 切換只需要 client-side state，不需要重新 fetch；hierarchy 資料在 Server Component 中靜態取得，無需額外 client-side fetch。

### 4. 老師判斷邏輯

此會員的老師 = 他有 `graduatedAt IS NOT NULL` 的 `InviteEnrollment`，對應的 `CourseInvite.courseCatalogId = 1`，該 `CourseInvite.createdBy` 即為老師。若有多筆（多次修課），取最早結業那次的老師。

## Risks / Trade-offs

- **[BFS 深度 × 廣度可能過大]** → 限制 N ≤ 10，每層查詢加 `take: 200` 上限，防止意外超大樹
- **[AdminSetting 無 cache]** → 每次頁面請求都查 DB；在 `force-dynamic` 頁面下此為正常行為，且設定極少變動，可接受
- **[Tabs 初始 tab 固定為「基本資料」]** → URL 不保留 tab 狀態，重新整理會回到第一個 tab；此為可接受的 UX 取捨

## Migration Plan

1. 新增 `AdminSetting` model → `make schema-update name=add_admin_setting`
2. 實作 `lib/data/admin-settings.ts`（`getAdminSetting`, `upsertAdminSetting`）
3. 實作 `lib/data/hierarchy.ts`（`getMemberHierarchy`）
4. 新增 `components/admin/member-hierarchy-tree.tsx`（Server Component）
5. 更新 `app/(user)/admin/members/[id]/page.tsx`（加 Tabs，導入 MemberHierarchyTree）
6. 新增 `app/actions/admin-settings.ts`（`updateHierarchyDepth` Server Action）
7. 新增 `app/(user)/admin/settings/page.tsx`（設定頁）
8. 側邊欄加入「系統設定」連結（僅 superadmin 可見）

**Rollback**：AdminSetting 遷移可直接 `DROP TABLE admin_settings`，其餘為純 UI 新增，不影響現有功能。
