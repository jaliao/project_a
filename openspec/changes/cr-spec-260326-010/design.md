## Context

學員專屬頁面（`/user/[spiritId]/page.tsx`）目前用 `prisma.inviteEnrollment.findMany()` 直接查詢，只取 `invite.courseLevel` 和 `invite.title`，沒有取得 `invite.completedAt` 或 `invite.cancelledAt`，所以無法區分課程狀態。

現有 `CourseSessionCard` 元件（`compact` variant + `href`）已可複用，無需新建元件。

## Goals / Non-Goals

**Goals:**
- 新增 `getMyEnrollments(userId)` data layer 查詢，回傳 enrollments 含 invite 狀態欄位
- 學員頁面課程區塊改為三個分組：申請中、已開課、已結業
- 各分組用 `CourseSessionCard` 卡片呈現（`compact` variant，`href` 指向 `/course/[id]`）
- 已取消課程的 enrollment 不顯示

**Non-Goals:**
- 修改 `CourseSessionCard` 元件本身
- 修改 `/learning` 學習紀錄頁面
- 分頁（數量少，全部顯示）

## Decisions

### D1：新增 `getMyEnrollments` 在 `lib/data/course-sessions.ts`

查詢 `inviteEnrollment` 並 include `invite`（需要 `id`, `title`, `courseLevel`, `maxCount`, `completedAt`, `cancelledAt`, `expiredAt`, `courseOrder.courseDate`）。

回傳型別：

```typescript
export type MyEnrollmentItem = {
  enrollmentId: number
  status: 'pending' | 'approved'
  inviteId: number
  title: string
  courseLevel: string
  maxCount: number
  enrolledCount: number      // 來自 invite._count.enrollments
  courseDate: string | null  // 來自 invite.courseOrder.courseDate
  expiredAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
}
```

### D2：分組邏輯在 page.tsx 計算，不在 data layer

data layer 只負責查詢，分組（filter）在 page.tsx 做，保持 data layer 單純。

分組規則：
- **申請中**：`status === 'pending'` && `cancelledAt === null`
- **已開課**：`status === 'approved'` && `completedAt === null` && `cancelledAt === null`
- **已結業**：`status === 'approved'` && `completedAt !== null`

### D3：空狀態顯示提示文字

各分組無資料時顯示簡短提示（如「目前沒有申請中的課程」），不顯示空白區塊。

## Risks / Trade-offs

- **enrolledCount 需要額外 count**：目前 `_count.enrollments` 只算全部，已夠用（卡片顯示報名人數即可，不需分 status）
- **頁面多一個 DB 查詢**（`getMyEnrollments`）：只在本人頁面查詢，影響範圍小

## Migration Plan

1. 在 `lib/data/course-sessions.ts` 新增 `getMyEnrollments` + `MyEnrollmentItem` 型別
2. 修改 `app/(user)/user/[spiritId]/page.tsx` — 呼叫新查詢、改為三分組 + 卡片顯示
