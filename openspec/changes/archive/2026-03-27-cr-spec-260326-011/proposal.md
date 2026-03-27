## Why

課程目前只有「已取消」與「已結業」兩個顯式狀態，缺少「進行中（授課中）」的中間狀態，講師無法標記課程已開始上課。同時課程卡片缺少狀態標籤與進度呈現，學員與講師無法快速掌握課程現況。課程列表在不同頁面的 RWD 網格也不一致。

## What Changes

- `CourseInvite` 新增 `startedAt` 欄位（DateTime?），有值代表「進行中」
- 課程狀態衍生邏輯：`cancelledAt` → 已取消、`completedAt` → 已結業、`startedAt` → 進行中、其他 → 招生中
- 課程詳情頁講師操作區新增「開始上課」按鈕，呼叫 `startCourseSession` action
- `CourseSessionCard` 新增狀態 Badge（招生中 / 進行中 / 已結業 / 已取消）
- `CourseSessionCard` 新增學員進度顯示（已核准 / 預計人數，視覺 bar）
- 學員頁面課程列表（`/user/[spiritId]`）改為 RWD 網格（`grid-cols-1 sm:grid-cols-2`）

## Capabilities

### New Capabilities

- `course-status`: 課程狀態標籤與「進行中」轉換 — 新增 `startedAt` 欄位、`startCourseSession` action、CourseSessionCard 狀態 Badge

### Modified Capabilities

- `create-course-session`: `CourseSessionCard` 新增狀態 Badge 與進度顯示（影響所有使用卡片的頁面）

## Impact

**受影響的檔案：**

| 檔案 | 修改內容 |
|------|---------|
| `prisma/schema/course-invite.prisma` | 新增 `startedAt DateTime?` 欄位 |
| `app/actions/course-invite.ts` | 新增 `startCourseSession(inviteId)` action |
| `components/course-session/course-session-card.tsx` | 新增 `status` prop（或衍生計算）、Badge、進度 bar |
| `app/(user)/course/[id]/course-detail-actions.tsx` | 新增「開始上課」按鈕（狀態為招生中時顯示） |
| `lib/data/course-sessions.ts` | 查詢補充 `startedAt` 欄位 |
| `app/(user)/user/[spiritId]/page.tsx` | 課程列表改 RWD 網格 |

**需要資料庫 migration**（新增 `startedAt` 欄位）。
