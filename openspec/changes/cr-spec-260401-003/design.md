## Context

`/admin/members` 目前為靜態清單，僅列出所有會員並提供重設密碼功能。管理者需要：搜尋特定會員、查看個別會員的學習與授課歷程、以及在特殊情況下刪除帳號。

現有相關 schema：
- `User`：包含 `realName`、`nickname`、`email`、`spiritId`、`role`、`createdAt`
- `InviteEnrollment`：`userId` → 學員報名記錄，透過 `invite.startedAt IS NOT NULL` 判斷已實際開課
- `CourseInvite.createdById`：建立者即為「授課人」，透過 `startedAt IS NOT NULL` 判斷已開課

## Goals / Non-Goals

**Goals:**
- 在清單頁加入即時搜尋（姓名/暱稱/Email），以 URL search params 傳遞，Server Component 篩選
- 新增 `/admin/members/[id]` 詳情頁，顯示基本資料、學習紀錄、授課紀錄
- 透過 `ENABLE_MEMBER_DELETE` 環境變數控制刪除按鈕顯示，刪除前需二次確認

**Non-Goals:**
- 批次刪除
- 刪除審計日誌（soft delete）
- 分頁（會員數量有限，清單全量載入即可）

## Decisions

### 搜尋：URL search params + Server Component 篩選
- 搜尋列為 Client Component（需要受控輸入），但篩選在 Server Component 的 Prisma query 完成
- 使用 `?q=` query string；頁面 `searchParams.q` 傳入 data layer
- Prisma 篩選：`OR [{ realName contains }, { name contains }, { nickname contains }, { email contains }]`
- 選擇 URL params 而非 state：可書籤化、可分享、重新整理不遺失

### 詳情頁：純 Server Component
- `/admin/members/[id]/page.tsx` 直接查詢 DB，無需額外 API route
- 學習紀錄：`InviteEnrollment` JOIN `CourseInvite` WHERE `startedAt IS NOT NULL`
- 授課紀錄：`CourseInvite` WHERE `createdById = userId` AND `startedAt IS NOT NULL`
- 顯示欄位：課程名稱（`CourseInvite.title`）、開始授課日期（`startedAt`）、課程目錄（`courseCatalog.label`）

### 刪除：環境變數 + AlertDialog 二次確認
- `process.env.ENABLE_MEMBER_DELETE === 'true'` 控制按鈕是否渲染（Server Component 判斷，不暴露到 client）
- `deleteMember(userId)` Server Action：先刪除關聯資料（Enrollment、CourseInvite 等），再刪 User
- 採 hard delete（無 soft delete）：這是管理者功能，操作前已二次確認

### 元件複用
- 搜尋列可做成獨立 `MemberSearchInput` client component，onDebounce 更新 URL
- 詳情頁重設密碼按鈕複用現有 `MemberResetButton`
- 刪除確認複用 shadcn `AlertDialog`

## Risks / Trade-offs

- **Hard delete 不可逆** → Mitigation：AlertDialog 二次確認，按鈕僅在 `ENABLE_MEMBER_DELETE=true` 時顯示
- **關聯資料刪除順序** → Mitigation：先查清楚 FK cascade 設定，必要時在 Server Action 中手動依序刪除
- **搜尋 debounce** → 使用 `useTransition` 或 debounce hook（300ms），避免每次按鍵都觸發導航

## Migration Plan

1. 新增 data layer function：`searchMembers(q)`、`getMemberDetail(id)`
2. 修改 `members/page.tsx` 加入搜尋 UI 與篩選邏輯
3. 新增 `members/[id]/page.tsx` 詳情頁
4. 新增 `deleteMember(userId)` Server Action（`admin.ts`）
5. 新增 `MemberSearchInput` client component
6. 新增 `MemberDeleteButton` client component（AlertDialog）
7. 更新 `.env.example`

無需 DB migration（無 schema 異動）。
