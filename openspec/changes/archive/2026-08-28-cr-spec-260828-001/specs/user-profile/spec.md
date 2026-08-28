# user-profile Delta（cr-spec-260828-001）

## ADDED Requirements

### Requirement: 個人資料頁中文姓名欄位標籤

個人資料頁（`/user/{spiritId}/profile`）「基本資料」區塊中綁定 `realName` 的輸入欄位，其標籤文字 SHALL 為「中文姓名（若無中文姓名請填上您護照上的拼音姓名）」，並保留必填標記（`*`）。此欄位 SHALL 仍為必填、SHALL 仍對應 `realName`，其驗證規則與送出流程 SHALL NOT 因此變更。

#### Scenario: 顯示新標籤文字

- **WHEN** 使用者開啟自己的個人資料頁，檢視「基本資料」區塊
- **THEN** 中文姓名欄位的標籤顯示「中文姓名（若無中文姓名請填上您護照上的拼音姓名）」，並帶必填標記

#### Scenario: 欄位仍為必填

- **WHEN** 使用者清空中文姓名欄位並送出個人資料表單
- **THEN** 系統拒絕更新並顯示必填錯誤訊息，行為與變更前一致

#### Scenario: 既有資料照常顯示與編輯

- **WHEN** 已填有 `realName` 的使用者開啟個人資料頁
- **THEN** 欄位帶出既有值，可正常修改並成功儲存

#### Scenario: 不影響註冊 onboarding 流程

- **WHEN** 使用者進入註冊 onboarding 精靈填寫姓名
- **THEN** onboarding 精靈的姓名欄位標籤不受此需求影響（沿用 `onboarding.realName`）
