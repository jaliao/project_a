## MODIFIED Requirements

### Requirement: 提問資料模型
系統 SHALL 提供 `SupportInquiry` 資料模型記錄學員提問，包含：分類（`SupportInquiryCategory`：帳號問題／課程問題／購買教材問題／其他）、內容（自由文字）、提問學員（可選外鍵，`onDelete: SetNull`）、狀態（`SupportInquiryStatus`：待處理／已回覆，預設待處理）、回覆內容、回覆管理者、回覆時間、建立時間、可選的關聯課程（`courseInviteId`，記錄此提問是否來自特定課程頁）。建立提問當下 SHALL 將提問人顯示所需資訊（顯示名稱、`spiritId`、真實姓名、性別文字、所屬單位文字）以文字快照寫入資料列本身，使提問人帳號日後被刪除時，這些資訊仍可完整呈現。

#### Scenario: 建立提問時預設待處理
- **WHEN** 學員送出一筆提問
- **THEN** 系統建立 `SupportInquiry` 記錄，`status = pending`，回覆相關欄位皆為空

#### Scenario: 一般提問無課程關聯
- **WHEN** 學員透過個人專區一般提問表單送出提問
- **THEN** 建立的 `SupportInquiry` 記錄 `courseInviteId` 為 `null`

#### Scenario: 課程頁提問記錄課程關聯
- **WHEN** 學員透過課程頁「聯繫管理者」入口送出提問
- **THEN** 建立的 `SupportInquiry` 記錄 `courseInviteId` 為該課程之 `CourseInvite.id`

#### Scenario: 建立提問時寫入提問人快照
- **WHEN** 學員送出一筆提問
- **THEN** 系統將當下的顯示名稱、`spiritId`、真實姓名、性別文字、所屬單位文字一併寫入該筆 `SupportInquiry`

#### Scenario: 提問人帳號被刪除後提問仍保留
- **WHEN** 某筆提問的提問人帳號之後被刪除（`deleteMember`）
- **THEN** 該筆 `SupportInquiry`（含回覆內容）SHALL NOT 被刪除，`userId` 更新為 `null`，快照欄位維持原值可讀
