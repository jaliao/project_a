## Context

角色模型現為四書講師：`UserRole` enum `teacher_1`~`teacher_4`，並以 `lib/auth-roles.ts` 的 `TEACHER_ROLE_BY_CATALOG`（courseCatalogId → 角色）把關逐書授課。「啟動事工 4」課程為 seed 建立的 `CourseCatalog`（`sortOrder 4`、`isActive: false`，停用佔位），`teacher_4` 對應之。系統尚未上線，無正式資料須保留；開發 DB 由 seed 重建。

`teacher_4` / 啟動事工 4 散落於：`prisma/schema/user.prisma`（enum）、`lib/auth-roles.ts`（對應與標籤）、`lib/data/dashboard.ts` + `app/(user)/admin/dashboard/page.tsx`（統計卡片）、`components/admin/members-filter.tsx`（篩選）、`app/api/admin/members/export/route.ts`（中文化）、`app/actions/admin.ts`（角色驗證）、`prisma/seed.ts`（課程目錄 + 保留帳號 roles）。

## Goals / Non-Goals

**Goals:**
- 自程式與 seed 完全移除 `teacher_4` 與「啟動事工 4」課程，角色模型縮為三書。
- 透過重置 DB 套用 enum 變更與新 seed。

**Non-Goals:**
- 不做資料遷移／向後相容（系統未上線，DB 重置即可）。
- 不更動其餘三書（teacher_1~3）行為。

## Decisions

### 決策 1：直接移除 enum 值，靠重置 DB 套用
`UserRole` enum 直接刪除 `teacher_4`。Postgres 無法直接 DROP enum 值，`prisma migrate dev` 會以重建 type 的方式產生 migration；因本變更最終會**重置開發 DB**（`make dev-clean` → `prisma-dev-deploy` → `prisma-dev-seed`），全新套用所有 migration，不必處理既有資料含 `teacher_4` 的情況。
- 替代方案：保留 enum 值僅停用 → 仍殘留死碼與 UI 選項，未達「廢除」目的，否決。

### 決策 2：`auth-roles.ts` 為單一事實來源，逐一移除
移除 `TEACHER_ROLES`、`TEACHER_ROLE_BY_CATALOG`（鍵 `4`）、角色↔catalog 反向對應、課程名稱對應、`ROLE_LABELS`、其餘角色陣列中的 `teacher_4`，並更新檔頭註解為 teacher_1~teacher_3。其餘以此為來源的 UI（篩選、統計、匯出）隨之移除對應項。

### 決策 3：seed 課程目錄縮為 3 本
`courses` 移除「啟動事工 4」（`sortOrder 4`），先修鏈僅保留 1→2→3；保留／測試帳號 roles 移除 `teacher_4`（含 `teacher@test.com`）。`spiritIdCounter` 等其餘邏輯不變。

### 決策 4：移除而非保留 UI 佔位
儀錶板統計卡片、會員身分篩選、匯出中文化中的「啟動事工 4 講師」直接移除（非隱藏）。

## Risks / Trade-offs

- [Postgres enum 移除需重建] → 由重置 DB 全新套用迴避；不在既有 DB 上 in-place 移除。
- [重置 DB 失敗（環境問題）] → 依 CLAUDE.md 程序；失敗則回報使用者、取得正確程序並修正 CLAUDE.md（使用者指定）。
- [遺漏引用點導致 build 失敗] → 移除 enum 值後 `tsc`／`build` 會抓出所有殘留 `teacher_4` 字面量（型別錯誤），作為完整性保證。

## Migration Plan

1. 修改 schema enum 與所有程式／seed 引用。
2. 重置開發 DB（CLAUDE.md「重置開發環境資料庫步驟」）：`make dev-clean` → `make prisma-dev-deploy` → `make prisma-dev-seed`。
3. 回滾＝還原程式與 schema 並重置。

## Open Questions

無。
