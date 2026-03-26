## Context

`CourseInvite` 現有隱式狀態：`cancelledAt`（已取消）、`completedAt`（已結業），但無「進行中」欄位。課程詳情頁講師操作按鈕（`CourseDetailActions`）只有「結業」與「取消授課」，缺少「開始上課」。`CourseSessionCard` 無狀態 Badge 也無進度視覺。

## Goals / Non-Goals

**Goals:**
- `CourseInvite` schema 新增 `startedAt DateTime?`，進行 DB migration
- 新增 `startCourseSession(inviteId)` Server Action
- `CourseDetailActions` 新增「開始上課」按鈕（課程未開始時顯示）
- `CourseSessionCard` 新增狀態 Badge（招生中 / 進行中 / 已結業 / 已取消）
- `CourseSessionCard` 新增學員進度 bar（enrolledCount / maxCount）
- 學員頁面課程三分組改為 RWD 網格（`grid-cols-1 sm:grid-cols-2`）
- data layer 查詢補充 `startedAt`、`cancelledAt`、`completedAt`

**Non-Goals:**
- 狀態機驗證（如不允許已結業再開始）以外的複雜流程
- 課程查詢頁（`course-sessions/`）的 RWD 調整（已有 grid）

## Decisions

### D1：狀態衍生邏輯統一定義

優先順序：`cancelledAt` > `completedAt` > `startedAt` > 預設

```typescript
type CourseStatus = 'recruiting' | 'active' | 'completed' | 'cancelled'

function getCourseStatus(item: {
  cancelledAt: Date | null
  completedAt: Date | null
  startedAt: Date | null
}): CourseStatus {
  if (item.cancelledAt) return 'cancelled'
  if (item.completedAt) return 'completed'
  if (item.startedAt) return 'active'
  return 'recruiting'
}
```

### D2：`CourseSessionCard` 新增 3 個選填 props

```typescript
startedAt?: Date | null
cancelledAt?: Date | null
completedAt?: Date | null
```

Card 內部用 `getCourseStatus` 計算狀態 Badge。不傳則不顯示 Badge（向下相容）。

### D3：進度 bar 用 enrolledCount / maxCount

`enrolledCount` 是全部 enrollment（pending + approved），不需額外查詢。
進度 bar 為簡單寬度比例（`width: ${Math.min(ratio * 100, 100)}%`），顏色對應狀態。

### D4：`startCourseSession` 不允許重複開始或對已取消/結業課程操作

action 內部驗證：有 `startedAt`、`cancelledAt`、`completedAt` 均返回錯誤。

### D5：data layer 查詢補充欄位

`getMyCourseSessions` 補充 `startedAt`、`cancelledAt`、`completedAt`，回傳型別 `CourseSessionItem` 同步新增。`getMyEnrollments` 的 `MyEnrollmentItem` 也補充 `startedAt`。

## Risks / Trade-offs

- **Migration 需手動執行**（`make schema-update`）→ 提醒使用者執行
- **向下相容**：Card 的新 props 全部選填，現有呼叫點不需馬上更新，狀態 Badge 只在傳入後顯示

## Migration Plan

1. 修改 `prisma/schema/course-invite.prisma`，新增 `startedAt DateTime?`
2. 執行 `make schema-update name=add_course_started_at`
3. 修改 `app/actions/course-invite.ts`，新增 `startCourseSession`
4. 修改 `lib/data/course-sessions.ts`，補充 `startedAt` 等欄位
5. 修改 `components/course-session/course-session-card.tsx`，新增 Badge + 進度 bar
6. 修改 `app/(user)/course/[id]/course-detail-actions.tsx`，新增「開始上課」按鈕
7. 修改 `app/(user)/course/[id]/page.tsx`，傳入狀態 props 到 Card 與 Actions
8. 修改學員頁面課程列表 RWD

## Open Questions

- 無
