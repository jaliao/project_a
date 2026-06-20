# instructor-feedback Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for instructor-feedback.

## Requirements

### Requirement: 講師資格回饋資料模型
系統 SHALL 於 `InviteEnrollment` 記錄講師資格回饋，欄位包含：`teacherRecommended`（布林，可空：`null`=未填回饋、`true`=推薦、`false`=不推薦）、`teacherFeedbackNote`（選填備註文字）、`teacherFeedbackAt`（填寫/最後更新時間）。回饋為**逐書**語意：對應該 `InviteEnrollment` 所屬課程的 `courseCatalogId`，即「是否推薦成為該書的講師」（書籍對應依 [[member-roles]] 的「講師身分與書籍對應」）。

#### Scenario: 尚未填寫回饋
- **WHEN** 某 `InviteEnrollment` 從未被填寫回饋
- **THEN** `teacherRecommended` 為 `null`、`teacherFeedbackAt` 為 `null`

#### Scenario: 推薦對應該課程的書
- **WHEN** 某學員於啟動豐盛（`courseCatalogId = 2`）課程的 enrollment 被填寫 `teacherRecommended = true`
- **THEN** 該回饋語意為「推薦其成為啟動豐盛講師（`teacher_2`）」

### Requirement: 回饋填寫權限與對象
系統 SHALL 僅允許**該課程建立者**（`CourseInvite.createdBy` 等於當前使用者）填寫該課程學員的講師資格回饋，且僅可對**已結業**（`InviteEnrollment.graduatedAt` 有值）的學員填寫。Server Action SHALL 權威驗證此兩項條件。

#### Scenario: 原老師對已結業學員填寫
- **WHEN** 課程建立者對該課程中 `graduatedAt` 有值的學員送出回饋
- **THEN** 系統儲存 `teacherRecommended` 與 `teacherFeedbackNote`，並將 `teacherFeedbackAt` 設為當前時間

#### Scenario: 非課程建立者嘗試填寫
- **WHEN** 非 `CourseInvite.createdBy` 的使用者呼叫回饋 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不寫入

#### Scenario: 對未結業學員填寫
- **WHEN** 課程建立者嘗試對 `graduatedAt` 為 null 的學員送出回饋
- **THEN** 系統拒絕並回傳錯誤，不寫入

### Requirement: 回饋內容與可重複編輯
回饋表單 SHALL 提供「是否推薦成為該課程講師」的是/否選擇，與**選填**備註。回饋 SHALL 可重複編輯，以最新一次送出為準，並更新 `teacherFeedbackAt`。

#### Scenario: 推薦並填備註
- **WHEN** 原老師選擇「推薦」並填寫備註後送出
- **THEN** `teacherRecommended = true`、`teacherFeedbackNote` 為所填內容

#### Scenario: 不推薦且不填備註
- **WHEN** 原老師選擇「不推薦」且未填備註後送出
- **THEN** `teacherRecommended = false`、`teacherFeedbackNote` 為 null

#### Scenario: 重新編輯既有回饋
- **WHEN** 原老師對已有回饋的學員再次送出不同內容
- **THEN** 系統以最新內容覆蓋，並更新 `teacherFeedbackAt` 為當前時間

### Requirement: 管理者檢視講師資格回饋
系統 SHALL 於會員詳情頁（`/admin/members/[id]`）的學習紀錄，對每筆已結業的 enrollment 顯示講師資格回饋：推薦狀態（推薦成為「{書名}講師」／不推薦／未填回饋）、備註、與填寫之老師（該課程建立者）。回饋 SHALL 僅為參考資訊，不自動授予任何講師身分。

#### Scenario: 顯示獲推薦的回饋
- **WHEN** 管理者檢視某會員，其某筆結業 enrollment `teacherRecommended = true`
- **THEN** 學習紀錄該列顯示「推薦成為{書名}講師」、備註（若有）與推薦老師姓名

#### Scenario: 顯示未填回饋
- **WHEN** 某筆已結業 enrollment 的 `teacherRecommended` 為 null
- **THEN** 該列回饋顯示「未填回饋」（或 `—`）

#### Scenario: 回饋不自動授予身分
- **WHEN** 某會員獲得「推薦成為啟動豐盛講師」回饋
- **THEN** 系統不自動加掛 `teacher_2`；管理者須以「身分編輯」手動加掛
