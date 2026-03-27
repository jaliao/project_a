## 1. Data Layer

- [x] 1.1 在 `lib/data/course-sessions.ts` 新增 `MyEnrollmentItem` 型別，包含 `enrollmentId`, `status`, `inviteId`, `title`, `courseLevel`, `maxCount`, `enrolledCount`, `courseDate`, `expiredAt`, `completedAt`, `cancelledAt`
- [x] 1.2 新增 `getMyEnrollments(userId: string)` 查詢函數，查詢 `inviteEnrollment` 並 include invite（含 `completedAt`, `cancelledAt`, `expiredAt`, `courseOrder.courseDate`, `_count.enrollments`）

## 2. 學員頁面課程區塊重構

- [x] 2.1 修改 `app/(user)/user/[spiritId]/page.tsx` — 呼叫 `getMyEnrollments` 取代直接 prisma 查詢，並計算三個分組陣列（pending、active、completed）
- [x] 2.2 課程區塊改為三個分組 UI：「申請中」、「已開課」、「已結業」，各分組以 `CourseSessionCard`（compact + href）呈現
- [x] 2.3 各分組無資料時顯示對應提示文字

## 3. 版本與文件

- [x] 3.1 更新 `config/version.json` patch 版本號 +1
- [x] 3.2 更新 `README-AI.md` 反映學員課程列表功能
