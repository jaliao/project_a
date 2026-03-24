## Why

cr-spec-260324-011 建立的課程詳情頁功能陽春，缺少基本資訊區塊、角色差異化操作、學員申請流程與書籍選購機制。需全面升級頁面設計，讓講師與學員各自有完整的操作體驗。

## What Changes

- **基本資訊區塊**：顯示開課內容、開課日期（CourseOrder.courseDate）、報名截止日期（expiredAt）、授課老師
- **學員清單**：依 `EnrollmentStatus` 顯示已核准學員；講師可另見待審清單並逐一同意
- **複製邀請連結**：講師可從課程頁直接複製邀請連結
- **學員申請流程**：學員訪問課程頁可點「申請參加」，彈出書籍選購 Dialog（無須購買 / 繁體教材 / 簡體教材）；報名截止後顯示「報名截止」狀態
- **InviteEnrollment 新增欄位**：`status`（`pending` | `approved`）、`materialChoice`（`none` | `traditional` | `simplified`）
- **講師結業操作**：講師可點選「結業」，寫入 `CourseInvite.completedAt`，頁面顯示「已結業」標籤（取代前期 disabled 佔位按鈕）
- **取消授課**：沿用 cr-spec-260324-011 實作，維持不變

## Capabilities

### New Capabilities
- `course-enrollment-application`: 學員在課程頁申請參加，含書籍選購 Dialog（無須購買/繁體/簡體），報名截止後顯示「報名截止」
- `instructor-enrollment-review`: 講師在課程頁檢視待審申請清單，並可逐一同意（`pending` → `approved`）
- `course-graduation`: 講師點選「結業」，寫入 `CourseInvite.completedAt`，頁面顯示「已結業」

### Modified Capabilities
- `course-session-detail`: 重新設計頁面佈局，新增基本資訊區塊（開課內容/日期/截止/老師）、複製邀請連結（講師）、角色差異化操作區；學員清單依 `status=approved` 過濾

## Impact

- 修改：`prisma/schema/course-invite.prisma`
  - `InviteEnrollment` 新增 `status EnrollmentStatus`（`pending` | `approved`，預設 `pending`）
  - `InviteEnrollment` 新增 `materialChoice MaterialChoice`（`none` | `traditional` | `simplified`，預設 `none`）
  - `CourseInvite` 新增 `completedAt DateTime?`
- 修改：`lib/data/course-sessions.ts`（`getCourseSessionById` 加入 status/materialChoice）
- 修改：`app/(user)/course/[id]/page.tsx`（重新設計頁面佈局與角色視圖）
- 修改：`app/(user)/course/[id]/course-detail-actions.tsx`（加入結業、角色判斷）
- 新增元件：`components/course-session/enrollment-application-dialog.tsx`（學員申請 + 書籍選購）
- 新增 Server Actions：`approveEnrollment`、`applyToCourse`、`graduateCourse`（於 `app/actions/course-invite.ts`）
- 現有 `joinInvite` action 改為建立 `status=pending` 的 InviteEnrollment（而非直接核准）
