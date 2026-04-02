## ADDED Requirements

### Requirement: 註冊頁 Google OAuth 入口
`/register` 頁面 SHALL 提供「以 Google 帳號繼續」按鈕，功能與行為和登入頁的 Google 按鈕一致。

#### Scenario: 點擊 Google 按鈕觸發 OAuth
- **WHEN** 使用者在 `/register` 頁點擊「以 Google 帳號繼續」
- **THEN** 系統觸發 Google OAuth 流程，成功後導向 `/dashboard`

#### Scenario: 已有帳號的 Google 使用者在註冊頁登入
- **WHEN** 使用者以已存在帳號的 Google email 完成 OAuth
- **THEN** 系統正常登入，不重複建立帳號，導向 `/dashboard`

## MODIFIED Requirements

### Requirement: Google OAuth 首次登入自動建帳
系統 SHALL 在 Google OAuth 使用者首次登入（含從 `/register` 頁觸發）時自動建立帳號並核發 Spirit ID。`/register` 與 `/login` 兩個入口均支援此流程。

#### Scenario: Google 新用戶首次登入
- **WHEN** 使用者以 Google 帳號首次進行 OAuth 登入（從任何入口）
- **THEN** 系統自動建立帳號、核發 Spirit ID，並導向 `/dashboard`

#### Scenario: Google 既有用戶再次登入
- **WHEN** 已建立帳號的使用者再次以 Google 登入
- **THEN** 系統正常登入，不重複建立帳號
