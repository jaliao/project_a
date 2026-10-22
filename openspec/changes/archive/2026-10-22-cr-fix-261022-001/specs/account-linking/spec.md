## ADDED Requirements

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
