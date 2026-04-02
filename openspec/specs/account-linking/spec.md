## MODIFIED Requirements

### Requirement: Google 帳號連動
使用者 SHALL 可在 Profile 頁面將 Google 帳號與現有帳號進行綁定或解除綁定。「連結帳號」按鈕 SHALL 為可點擊狀態，點擊後觸發 Google OAuth 流程完成連動。

#### Scenario: 綁定 Google 帳號
- **WHEN** 使用者於 Profile 點擊「連結帳號」並完成 Google OAuth 授權
- **THEN** 系統將 Google Provider 記錄關聯至現有帳號，Profile 顯示「Google - 已連結」

#### Scenario: Google 帳號 email 與系統帳號 email 相符時自動連動
- **WHEN** 使用者以 email 與系統帳號相同的 Google 帳號完成 OAuth
- **THEN** NextAuth 自動將 Google Account 記錄關聯至現有 User，不建立新帳號

#### Scenario: Google 帳號已被其他帳號使用
- **WHEN** 使用者嘗試綁定一個已與其他帳號關聯的 Google 帳號
- **THEN** 系統拒絕並回傳錯誤「此 Google 帳號已連結至其他帳號」

#### Scenario: 解除 Google 帳號綁定
- **WHEN** 使用者點擊「解除連結」且帳號仍有密碼或其他登入方式
- **THEN** 系統移除 Google Provider 關聯，Profile 顯示「Google - 未連結」

#### Scenario: 唯一登入方式不可解除
- **WHEN** 使用者嘗試解除 Google 綁定，但帳號無密碼且無其他第三方連結
- **THEN** 系統拒絕並提示「請先設定密碼再解除連結，以免無法登入」
