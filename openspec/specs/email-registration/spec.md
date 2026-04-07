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

### Requirement: Email 註冊成功回饋
Email 註冊成功後，系統 SHALL 以 Dialog 告知使用者帳號已建立，並提供「返回首頁」按鈕導向 `/`。

#### Scenario: 註冊成功顯示 Dialog
- **WHEN** 使用者送出有效 Email 且 `registerWithEmail` 回傳 `success: true`
- **THEN** 系統開啟 Dialog，顯示成功訊息，不再顯示 toast

#### Scenario: 點擊返回首頁
- **WHEN** 使用者在成功 Dialog 中點擊「返回首頁」
- **THEN** 系統導向 `/`

#### Scenario: Dialog 無法直接關閉
- **WHEN** 使用者嘗試點擊 Dialog 背景或按 Esc
- **THEN** Dialog 維持開啟（使用者必須點擊「返回首頁」才能離開）
