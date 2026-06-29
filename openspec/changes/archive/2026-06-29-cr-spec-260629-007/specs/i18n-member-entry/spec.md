## ADDED Requirements

### Requirement: 未登入流程頁面在地化
未登入流程頁面（login／register／forgot-password／reset-password／recover-account／onboarding）的 UI 文案（標題、說明、按鈕、placeholder、步驟文案）SHALL 以 i18n 命名空間取用、隨當前語言呈現，不寫死語言字串。server 文案用 `getTranslations`、client 用 `useTranslations`。

#### Scenario: 註冊頁在地化
- **WHEN** 以非預設語言開啟 `/en/register`
- **THEN** 頁面標題、說明、按鈕、placeholder 以英文呈現

#### Scenario: 多步驟流程在地化
- **WHEN** 以非預設語言進行 onboarding 或找回帳號的各步驟
- **THEN** 各步驟標題與說明以該語言呈現；動態文案（如剩餘次數）以 ICU 參數正確代入

#### Scenario: 法律長文不在地化
- **WHEN** 開啟 terms／privacy 頁
- **THEN** 其法律長文維持繁體（不在本批在地化範圍）

### Requirement: 小型會員頁在地化
小型會員頁（notifications／invites／learning／match-board）的 UI 文案 SHALL 以 i18n 取用、隨當前語言呈現。

#### Scenario: 通知頁在地化
- **WHEN** 以非預設語言開啟通知頁
- **THEN** 頁面文案以該語言呈現

#### Scenario: 未遷移字串回退繁體
- **WHEN** 某尚未遷移的字串於非預設語言呈現
- **THEN** 回退顯示繁體，不顯示原始 key、不破版
