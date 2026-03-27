## Context

`/course/[id]` 詳情頁由 cr-spec-260324-011 建立，目前僅有基本學員清單與取消課程功能，無角色差異化。本變更在現有頁面基礎上全面升級，引入申請審核流程與書籍選購機制。

## Goals / Non-Goals

**Goals:**
- 角色視圖分離：講師與學員看到不同操作區塊
- 學員申請流程：申請 → pending → 講師審核 → approved
- 書籍選購：申請時一併記錄書籍需求
- 講師結業：CourseInvite.completedAt 正式實作
- 基本資訊區塊完整化

**Non-Goals:**
- 拒絕（reject）申請功能（本期只需 approve）
- 書籍出貨 / 庫存管理
- 課程聊天室或通知信件
- 學員取消自己的申請

## Decisions

### 申請狀態模型：InviteEnrollment 加 status 欄位
新增 `EnrollmentStatus` enum（`pending` | `approved`）到 `InviteEnrollment`，預設 `pending`。
**理由**：複用現有 InviteEnrollment 資料結構，避免引入額外的 Application 資料表。
**替代方案**：新增獨立 `CourseApplication` 資料表 → 過度設計，本期需求不需要。

### joinInvite action 改為建立 pending 狀態
現有的 `joinInvite`（invite link 流程）改為建立 `status=pending` 的 InviteEnrollment。
學員仍透過邀請連結到達課程頁，但不再自動核准，需講師同意。
**理由**：維持單一申請入口，讓講師完整掌控名單。

### 書籍選購：MaterialChoice enum 於 InviteEnrollment
新增 `MaterialChoice` enum（`none` | `traditional` | `simplified`），存於 `InviteEnrollment.materialChoice`，預設 `none`。
不複用 `MaterialVersion`（有 `both` 選項，語意不同）。

### 結業：CourseInvite 加 completedAt 欄位
`completedAt DateTime?` 有值即代表已結業。頁面顯示「已結業」標籤，操作按鈕隱藏。

### 角色判斷：server component 比對 session.user.id
`page.tsx`（Server Component）比對 `session.user.id === session_detail.createdBy.id`，分別渲染講師視圖或學員視圖，無需 client-side 判斷。

### 複製邀請連結：client component 使用 Clipboard API
Token 存於 CourseInvite，URL 格式 `{origin}/invite/{token}`，透過 `navigator.clipboard` 複製。

## Risks / Trade-offs

- [風險] 現有已 approved 的 InviteEnrollment 在 migration 後預設為 pending → Mitigation：migration 時將所有現有記錄的 status 設為 `approved`（data migration）
- [Trade-off] 無 reject 功能 → 本期接受，待後續需求再加
- [風險] 學員透過同一邀請連結多次訪問 → 沿用 upsert 機制，不重複建立

## Migration Plan

1. 修改 `prisma/schema/course-invite.prisma`（EnrollmentStatus、MaterialChoice enums + 欄位）
2. Migration SQL 補充：`UPDATE invite_enrollments SET status = 'approved'`（現有資料視為已核准）
3. 執行 `make schema-update name=add_enrollment_status_material_choice`
4. 更新 `joinInvite` action，建立 pending 狀態

## Open Questions

- 申請參加的入口：學員必須先透過邀請連結到達課程頁，還是可直接在課程頁申請？（暫定：透過邀請連結 `/invite/[token]` 轉至課程頁，在課程頁完成書籍選購申請步驟）
