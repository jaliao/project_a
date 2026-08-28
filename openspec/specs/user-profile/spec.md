# user-profile Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for user-profile.
## Requirements
### Requirement: 身分標籤顯示
學員頁面基本資料區塊 SHALL 顯示身分標籤，支援多個 Badge 並排顯示。標籤來源為 `role`（系統管理員）與結業證書（啟動靈人 N 講師），標籤順序為角色標籤優先，講師標籤依等級升序排列。

#### Scenario: 管理員且有講師資格
- **WHEN** 使用者 role 為 admin 且有 level1 結業證書
- **THEN** 基本資料顯示「系統管理員」與「啟動靈人 1 講師」兩個 Badge

#### Scenario: 僅有講師資格
- **WHEN** 使用者 role 為 user 且有 level1 結業證書
- **THEN** 基本資料僅顯示「啟動靈人 1 講師」Badge

#### Scenario: 無任何資格
- **WHEN** 使用者 role 為 user 且無任何結業證書
- **THEN** 身分標籤欄位顯示「—」

### Requirement: 個人資料頁性別欄位必填
個人基本資料頁（`/profile` 與 `/user/[spiritId]/profile`）的性別欄位 SHALL 僅提供「男」／「女」兩個選項，不再提供「未設定」；送出時 SHALL 要求性別為 `male` 或 `female`，不接受 `unspecified`。

#### Scenario: 下拉選單不含未設定選項
- **WHEN** 使用者開啟個人資料頁的性別欄位下拉選單
- **THEN** 選項僅有「男」與「女」，無「未設定」

#### Scenario: 未選擇性別即送出被拒
- **WHEN** 個人資料頁表單送出的性別值不是 `male` 或 `female`
- **THEN** 系統拒絕更新，顯示性別必填錯誤訊息（`validation.genderRequired`），不寫入資料庫

#### Scenario: 既有未設定帳號可正常改為男／女
- **WHEN** `gender` 現值為 `unspecified` 的使用者於個人資料頁選擇「男」或「女」並送出
- **THEN** 系統成功更新 `gender` 為所選值（欄位可正常編輯，非唯讀鎖定）

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

