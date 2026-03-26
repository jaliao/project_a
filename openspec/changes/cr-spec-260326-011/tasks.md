## 1. Schema 與 Migration

- [x] 1.1 修改 `prisma/schema/course-invite.prisma`，在 `CourseInvite` 新增 `startedAt DateTime?`
- [x] 1.2 執行 `make schema-update name=add_course_started_at`

## 2. Server Action

- [x] 2.1 在 `app/actions/course-invite.ts` 新增 `startCourseSession(inviteId)` action：驗證權限、驗證狀態（未開始/未取消/未結業）、設定 `startedAt = new Date()`，並呼叫 `createNotification` 通知開課（選填）
- [x] 2.2 `startCourseSession` 成功後呼叫 `revalidatePath`

## 3. Data Layer

- [x] 3.1 修改 `lib/data/course-sessions.ts` — `CourseSessionItem` 型別新增 `startedAt: Date | null`、`cancelledAt: Date | null`、`completedAt: Date | null`
- [x] 3.2 修改 `getMyCourseSessions` 查詢，select 補充 `startedAt`、`cancelledAt`、`completedAt`
- [x] 3.3 修改 `MyEnrollmentItem` 型別新增 `startedAt: Date | null`，`getMyEnrollments` 查詢補充 `startedAt`

## 4. CourseSessionCard 增強

- [x] 4.1 `CourseSessionCard` 新增選填 props：`startedAt?: Date | null`、`cancelledAt?: Date | null`、`completedAt?: Date | null`
- [x] 4.2 新增課程狀態 Badge（招生中 / 進行中 / 已結業 / 已取消），顏色對應設計
- [x] 4.3 新增學員進度 bar（enrolledCount / maxCount 比例）

## 5. 課程詳情頁講師操作

- [x] 5.1 修改 `app/(user)/course/[id]/course-detail-actions.tsx` — 新增 `isStarted` prop，招生中時顯示「開始上課」按鈕，點擊後呼叫 `startCourseSession`，成功顯示 toast 並 refresh
- [x] 5.2 修改 `app/(user)/course/[id]/page.tsx` — 傳入 `isStarted`（`!!courseSession.startedAt`）至 `CourseDetailActions`；傳入 `startedAt`、`cancelledAt`、`completedAt` 至相關 Card 呈現

## 6. 學員課程列表 RWD

- [x] 6.1 修改 `app/(user)/user/[spiritId]/page.tsx` — 三分組各自的卡片容器改為 `grid grid-cols-1 sm:grid-cols-2 gap-3`，並傳入 `startedAt`、`cancelledAt`、`completedAt` 給 `CourseSessionCard`

## 7. 版本與文件

- [x] 7.1 更新 `config/version.json` patch 版本號 +1
- [x] 7.2 更新 `README-AI.md` 反映課程狀態功能
