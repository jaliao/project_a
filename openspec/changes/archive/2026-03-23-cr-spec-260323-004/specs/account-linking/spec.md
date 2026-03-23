## ADDED Requirements

### Requirement: Google 帳號連動
使用者 SHALL 可在 Profile 頁面將 Google 帳號與現有帳號進行綁定或解除綁定。

#### Scenario: 綁定 Google 帳號
- **WHEN** 使用者於 Profile 點擊「連結 Google 帳號」並完成 OAuth 授權
- **THEN** 系統將 Google Provider 記錄關聯至現有帳號，Profile 顯示「Google - 已連結」

#### Scenario: Google 帳號已被其他帳號使用
- **WHEN** 使用者嘗試綁定一個已與其他帳號關聯的 Google 帳號
- **THEN** 系統拒絕並回傳錯誤「此 Google 帳號已連結至其他帳號」

#### Scenario: 解除 Google 帳號綁定
- **WHEN** 使用者點擊「解除 Google 連結」且帳號仍有密碼或其他登入方式
- **THEN** 系統移除 Google Provider 關聯，Profile 顯示「Google - 未連結」

#### Scenario: 唯一登入方式不可解除
- **WHEN** 使用者嘗試解除 Google 綁定，但帳號無密碼且無其他第三方連結
- **THEN** 系統拒絕並提示「請先設定密碼再解除連結，以免無法登入」

### Requirement: LINE 帳號連動（架構保留）
系統 SHALL 保留 LINE 帳號綁定的資料欄位與 UI 入口，實際 OAuth 流程於後續 CR 啟用。

#### Scenario: LINE 連動入口顯示
- **WHEN** 使用者進入 Profile 的帳號連動區塊
- **THEN** 頁面顯示「LINE - 未連結」，入口按鈕存在但標示「即將推出」或暫時停用

### Requirement: 手機號碼綁定
使用者 SHALL 可在 Profile 頁面設定手機號碼，系統記錄但本次不進行 SMS 驗證。

#### Scenario: 設定手機號碼
- **WHEN** 使用者輸入有效格式的手機號碼並儲存
- **THEN** 系統儲存手機號碼，`isPhoneVerified` 保持 `false`（待後續 CR 實作 SMS 驗證）

#### Scenario: 手機號碼格式驗證
- **WHEN** 使用者輸入非台灣手機格式（非 09xxxxxxxx 或 +886xxxxxxxxx）
- **THEN** 系統回傳格式驗證錯誤
