## MODIFIED Requirements

### Requirement: 講師結業課程（含選擇通過學員）
`graduateCourse` Server Action SHALL 接收新格式參數：`inviteId`、`lastCourseDate`（最後一堂課程日期）、`enrollmentResults`（每位學員的結業狀態與未結業原因陣列）。

Action 執行時：
- 以 `lastCourseDate` 設定 `CourseInvite.completedAt`（取代原本的 `new Date()`）
- 已結業學員：`InviteEnrollment.graduatedAt = lastCourseDate`
- 未結業學員：`InviteEnrollment.nonGraduateReason = reason`（`insufficient_time` 或 `other`）

#### Scenario: 成功結業（部分學員）
- **WHEN** 講師提供有效 `lastCourseDate`、至少一位已結業學員
- **THEN** 系統更新 `CourseInvite.completedAt = lastCourseDate`，已結業學員 `graduatedAt = lastCourseDate`，未結業學員儲存 `nonGraduateReason`

#### Scenario: 未結業學員缺少原因
- **WHEN** 某位學員 `graduated: false` 但 `nonGraduateReason` 為空
- **THEN** Action 回傳 `{ success: false, message: '請填寫未結業原因' }`

#### Scenario: 課程已結業時重複送出
- **WHEN** `CourseInvite.completedAt` 已有值時再次呼叫 `graduateCourse`
- **THEN** Action 回傳 `{ success: false, message: '課程已結業' }`
