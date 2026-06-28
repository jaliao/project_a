## Why

目前課程「開始上課」按鈕僅在**單一**教材訂單已收件（`CourseOrder.receivedAt != null`）時才出現，且 `startCourseSession` 不做任何條件驗證。實務上講師需要**邊招生、邊分批申請教材**（不同學員/不同時間陸續申請），現行「一門課只能有一筆教材訂單」的模型無法支援；且當條件未達成時，按鈕直接隱藏，講師不知道**為什麼還不能開課**。

## What Changes

- **BREAKING（schema）**：`CourseInvite` ↔ `CourseOrder` 由「一對一」（`CourseInvite.courseOrderId`）改為「一門課對多筆訂單」（`CourseOrder.courseInviteId`）。一門課可在開課前**持續申請多筆教材訂單**，每筆各自獨立跑「申請 → 批價 → 付款 → 寄送 → 收件」流程。
- 教材申請維持全程開放：在所有教材收件前，講師可**繼續新增**教材訂單；**招生**（學員申請與講師核准）同時維持開放（現行招生不受 `startedAt` 以外限制，確認沿用即可）。
- **開課門檻重新定義**：當以下條件全部成立時才可開課——
  1. 至少 **1 位已核准（approved）學員**；
  2. 該課程**至少有一筆**教材訂單，且**所有**教材訂單皆已收件（每筆 `receivedAt != null`）；
  3. 課程仍為招生中（`startedAt` / `cancelledAt` / `completedAt` 皆為 null）。
- **開課按鈕常駐顯示**（課程可操作時）：未達門檻時按鈕為**停用（disabled）**狀態，並在旁列出**未達成的原因清單**（例如「尚無已核准學員」「教材訂單尚未全部收件」）。
- `startCourseSession` server action **加入相同條件驗證**，未達門檻時拒絕並回傳具體原因，避免繞過 UI。
- 教材申請相關 UI（講師端課程詳情、管理端教材管理/出貨單）改為以**訂單清單**呈現，並新增「再申請一筆教材」入口。

## Capabilities

### New Capabilities
- `course-multi-material-order`: 一門課程支援多筆教材訂單（一對多），開課前可持續申請；每筆訂單各自獨立走完整教材金流與寄送流程。

### Modified Capabilities
- `course-status`: 重新定義「開始上課」按鈕的顯示與啟用條件（≥1 已核准學員 + 所有教材訂單皆已收件），按鈕改為常駐＋未達門檻顯示原因；`startCourseSession` 加入條件驗證。

## Impact

- Schema：`prisma/schema/course-order.prisma`（`CourseOrder` 新增 `courseInviteId`）、`prisma/schema/course-invite.prisma`（移除 `courseOrderId`，改 `orders CourseOrder[]`）；需 migration 並回填既有關聯（資料保留）
- Server actions：`app/actions/course-order.ts`（建立/編輯/確認改以多訂單為基礎）、`app/actions/course-invite.ts`（`startCourseSession` 條件驗證）
- 資料層：`lib/data/course-sessions.ts`（課程詳情帶出訂單清單與「全部收件」判定）、`lib/utils/material-order-status.ts`
- UI：`app/(user)/course/[id]/course-detail-actions.tsx`、`app/(user)/course/[id]/page.tsx`、`components/course-session/material-order-dialog.tsx`、管理端 `app/(user)/admin/materials/**`（清單/列印改多訂單）
- 其他：`prisma/seed.ts`（多訂單關聯）、dashboard 統計若依賴 `courseOrderId` 之處
- 文件：依 CLAUDE.md 第 9 點同步 `doc/老師手冊.md`、`doc/管理者操作手冊.md`；版本號 +1
