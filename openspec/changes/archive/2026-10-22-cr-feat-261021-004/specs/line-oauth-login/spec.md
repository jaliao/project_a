## ADDED Requirements

### Requirement: 登入頁 LINE OAuth 入口

`/login` 頁面 SHALL 提供「以 LINE 繼續」按鈕，置於現有 Google 按鈕下方，功能為觸發 LINE OAuth 授權流程。

#### Scenario: 點擊 LINE 按鈕觸發 OAuth

- **WHEN** 使用者在 `/login` 頁點擊「以 LINE 繼續」
- **THEN** 系統觸發 LINE OAuth 授權流程，成功後依使用者是否為既有帳號導向對應結果（既有帳號登入成功，或進入全新帳號 onboarding）

### Requirement: LINE 既有帳號直接登入

當使用者的 LINE `providerAccountId` 已存在於 `Account` 表關聯記錄時，系統 SHALL 直接登入對應帳號，不重複建立新帳號。

#### Scenario: 已綁定 LINE 的使用者再次登入

- **WHEN** 使用者的 LINE 帳號已有對應 `Account` 記錄（`provider = 'line'`）完成 OAuth
- **THEN** 系統登入既有 `User`，不建立新帳號，正常導向 `callbackUrl`

### Requirement: LINE 全新使用者自動建帳

當使用者以 LINE OAuth 登入、且其 `providerAccountId` 查無對應 `Account` 記錄時，系統 SHALL 自動建立新 `User` 帳號：核發 `spiritId`、依 `spiritId` 衍生預設 `loginHandle`、`email` 寫入 LINE 回傳的 email（若有）或維持 `null`（若無）。系統 SHALL NOT 嘗試以 email 自動連結既有帳號。

#### Scenario: 全新 LINE 使用者首次登入且 LINE 未提供 email

- **WHEN** 使用者首次以 LINE OAuth 登入，其 `providerAccountId` 查無對應帳號，且 LINE 授權未回傳 email
- **THEN** 系統建立新 `User`（`email` 為 `null`、核發 `spiritId` 與衍生 `loginHandle`），建立對應 `Account` 記錄，導向 onboarding 補齊基本資料

#### Scenario: 全新 LINE 使用者首次登入且 LINE 提供 email

- **WHEN** 使用者首次以 LINE OAuth 登入，其 `providerAccountId` 查無對應帳號，且 LINE 授權回傳 email
- **THEN** 系統建立新 `User`（`email` 寫入該值、核發 `spiritId` 與衍生 `loginHandle`），**不**檢查該 email 是否已存在於其他既有帳號、不自動合併或連結，視為獨立新帳號

#### Scenario: 暫停或已合併帳號登入時仍受既有守衛規則保護

- **WHEN** LINE 對應的既有帳號為暫停中（`suspendedAt` 非空）或已被合併（`mergedIntoId` 非空）
- **THEN** 系統依現有規則導向 `/account-suspended` 或 `/account-merged`，不允許登入成功，即使該帳號 `email` 為 `null`

### Requirement: 無密碼帳號可於個人資料頁自助設定登入密碼

帳號尚未設定密碼（`passwordHash` 為 `null`，含 LINE-only 與 Google-only）者，系統 SHALL 於個人資料頁的帳號修改卡片提供「設定登入密碼」表單；使用者可選擇不設定，繼續僅以原第三方帳號作為唯一登入方式。此功能不侷限於 onboarding 流程內（全新 OAuth 使用者 `isTempPassword` 恆為 `false`，不會經過 onboarding wizard，見 account-linking／auth-session 既有行為）。

#### Scenario: 使用者於個人資料頁設定登入密碼

- **WHEN** 無密碼帳號的使用者於個人資料頁「設定登入密碼」表單輸入並確認密碼
- **THEN** 系統寫入 `passwordHash`，之後可用「帳號代碼＋密碼」或「Email＋密碼」（若有 email）或原第三方帳號任一方式登入；個人資料頁重新整理後顯示完整的帳號修改表單與變更密碼卡

#### Scenario: 使用者不設定密碼

- **WHEN** 無密碼帳號的使用者不操作「設定登入密碼」表單
- **THEN** 系統不寫入 `passwordHash`，該帳號僅能以原第三方帳號（LINE／Google）登入
