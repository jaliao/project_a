## 1. 資料層更新

- [x] 1.1 在 `lib/data/course-sessions.ts` 的 `EnrollmentRecord` 型別新增 `nonGraduateReason: string | null`
- [x] 1.2 在 `getCourseSessionById` 的 enrollments select 補充 `nonGraduateReason: true`

## 2. 課程詳情頁結業資訊區塊

- [x] 2.1 在 `app/(user)/course/[id]/page.tsx` 已結業（`isCompleted`）條件下插入「結業資訊」區塊
- [x] 2.2 顯示最後一堂課程日期（格式化 `courseSession.completedAt`，YYYY/MM/DD）
- [x] 2.3 顯示已結業學員清單（`approvedEnrollments` 中 `graduatedAt` 有值者）
- [x] 2.4 顯示未結業學員清單（`approvedEnrollments` 中 `graduatedAt` 為 null 者）及 `nonGraduateReason` 中文標籤
