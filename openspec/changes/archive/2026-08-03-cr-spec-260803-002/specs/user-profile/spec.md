## ADDED Requirements

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
