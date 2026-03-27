## Why

課程詳情頁（`/course/[id]`）目前已結業的課程只顯示「已結業」標籤，缺乏結業細節（最後一堂課程日期、已結業學員、未結業學員及原因），講師與學員無法回顧結業記錄。

## What Changes

- 課程詳情頁已結業課程新增「結業資訊」區塊
- 顯示最後一堂課程日期（`CourseInvite.completedAt`）
- 顯示已結業學員清單（`InviteEnrollment.graduatedAt` 有值）
- 顯示未結業學員清單及原因（`InviteEnrollment.nonGraduateReason`）
- 資料查詢層補充 `nonGraduateReason` 欄位

## Capabilities

### New Capabilities
- `course-graduation-info`: 課程詳情頁已結業狀態下的結業資訊顯示區塊

### Modified Capabilities

（無規格層級變更）

## Impact

- **修改 data layer**: `lib/data/course-sessions.ts` — `getCourseSessionById` 的 `enrollments` select 補充 `nonGraduateReason`；`EnrollmentRecord` 型別新增該欄位
- **修改課程詳情頁**: `app/(user)/course/[id]/page.tsx` — 已結業時顯示結業資訊區塊
