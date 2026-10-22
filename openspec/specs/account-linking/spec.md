# account-linking Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for account-linking.

## Requirements

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

### Requirement: LINE 帳號連動狀態顯示

Profile 頁「帳號連動」卡片的 LINE 區塊 SHALL 依 `linkedProviders.includes('line')` 顯示正確的「已連結」／「未連結」狀態，比照 Google 區塊既有的顯示邏輯。本階段 LINE 的「連結／解除連結」互動按鈕 SHALL 維持停用狀態並顯示「即將推出」，實際 OAuth 綁定／解綁互動不在本階段範圍內。

#### Scenario: 已用 LINE 登入的帳號顯示已連結

- **WHEN** 使用者的 `Account` 表已有 `provider = 'line'` 記錄（`linkedProviders` 含 `'line'`）
- **THEN** Profile 頁「帳號連動」卡片 LINE 區塊顯示「已連結」

#### Scenario: 未綁 LINE 的帳號顯示未連結

- **WHEN** 使用者的 `Account` 表無 `provider = 'line'` 記錄（`linkedProviders` 不含 `'line'`）
- **THEN** Profile 頁「帳號連動」卡片 LINE 區塊顯示「未連結」

#### Scenario: LINE 互動按鈕本階段仍停用

- **WHEN** 使用者檢視「帳號連動」卡片 LINE 區塊，無論已連結或未連結
- **THEN** 系統顯示停用狀態的按鈕與「即將推出」文字，點擊不觸發任何 OAuth 綁定／解綁流程
