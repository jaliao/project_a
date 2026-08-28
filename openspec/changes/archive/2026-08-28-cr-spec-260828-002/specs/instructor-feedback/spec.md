# instructor-feedback Delta（cr-spec-260828-002）

## MODIFIED Requirements

### Requirement: 回饋填寫權限與對象

系統 SHALL 允許**該課程建立者（`CourseInvite.createdBy` 等於當前使用者）或管理者（`canAccessAdmin`）**填寫該課程學員的講師資格回饋，且僅可對**已結業**（`InviteEnrollment.graduatedAt` 有值）的學員填寫。Server Action（`upsertInstructorFeedback`）SHALL 權威驗證此兩項條件。回饋內容與逐書語意不因填寫者為管理者而改變（仍對應該 `InviteEnrollment` 所屬課程的 `courseCatalogId`）。

#### Scenario: 原老師對已結業學員填寫

- **WHEN** 課程建立者對該課程中 `graduatedAt` 有值的學員送出回饋
- **THEN** 系統儲存 `teacherRecommended` 與 `teacherFeedbackNote`，並將 `teacherFeedbackAt` 設為當前時間

#### Scenario: 管理者對已結業學員填寫

- **WHEN** 管理者（非該課建立者）對該課程中 `graduatedAt` 有值的學員送出回饋
- **THEN** 系統儲存 `teacherRecommended` 與 `teacherFeedbackNote`，並更新 `teacherFeedbackAt`；該筆回饋照常計入後台「推薦講師」清單

#### Scenario: 無權限者嘗試填寫

- **WHEN** 非 `CourseInvite.createdBy` 且不具 `canAccessAdmin` 的使用者呼叫回饋 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不寫入

#### Scenario: 對未結業學員填寫

- **WHEN** 該課建立者或管理者嘗試對 `graduatedAt` 為 null 的學員送出回饋
- **THEN** 系統拒絕並回傳錯誤，不寫入

#### Scenario: 回饋不自動授予身分

- **WHEN** 管理者送出「推薦成為啟動豐盛講師」的回饋
- **THEN** 系統不自動加掛 `teacher_2`；仍須由管理者於「身分編輯」手動加掛
