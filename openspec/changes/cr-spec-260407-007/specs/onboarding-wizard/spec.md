## ADDED Requirements

### Requirement: Onboarding Wizard 三步驟流程
`/onboarding` 頁面 SHALL 以三步驟 Wizard 引導新會員完成首次登入設定，並在頂部顯示步驟進度指示。

#### Scenario: 首次進入顯示 Step 1
- **WHEN** `isTempPassword=true` 的用戶被導向 `/onboarding`
- **THEN** 頁面顯示 Step 1「設定您的密碼」，進度指示顯示 1/3

#### Scenario: 已完成 onboarding 的用戶直接放行
- **WHEN** `isTempPassword=false` 且 `realName`、`phone` 均已填寫的用戶開啟 `/onboarding`
- **THEN** 系統直接導向 `/dashboard`，不顯示 Wizard

### Requirement: Step 1 — 設定密碼
Step 1 SHALL 要求用戶輸入目前臨時密碼、新密碼與確認新密碼，成功後進入 Step 2。

#### Scenario: 密碼設定成功進入 Step 2
- **WHEN** 用戶於 Step 1 輸入正確臨時密碼及符合規則的新密碼並送出
- **THEN** 系統呼叫 `changeTempPassword` action，成功後 Wizard 切換至 Step 2，進度指示更新為 2/3

#### Scenario: 三個密碼欄皆可切換明碼
- **WHEN** 用戶點擊任一密碼欄右側眼睛 icon
- **THEN** 該欄切換為明碼顯示，再次點擊恢復密碼顯示

#### Scenario: 密碼錯誤顯示錯誤訊息
- **WHEN** 用戶輸入的臨時密碼不正確或新密碼不符規則
- **THEN** 顯示對應錯誤訊息，不進入 Step 2

### Requirement: Step 2 — 填寫基本資料
Step 2 SHALL 要求用戶填寫 `realName`（真實姓名）與 `phone`（手機號碼），成功後進入 Step 3。

#### Scenario: 基本資料填寫成功進入 Step 3
- **WHEN** 用戶於 Step 2 輸入有效的 realName 與 phone 並送出
- **THEN** 系統呼叫 `completeOnboardingProfile` action，成功後 Wizard 切換至 Step 3，進度指示更新為 3/3

#### Scenario: 欄位未填顯示驗證錯誤
- **WHEN** 用戶未填寫 realName 或 phone 即送出
- **THEN** 顯示欄位層級驗證錯誤，不進入 Step 3

#### Scenario: 說明文字告知其餘欄位可後填
- **WHEN** 用戶進入 Step 2
- **THEN** 頁面顯示說明「其餘資料可於個人資料頁補填」，降低填寫壓力

### Requirement: Step 3 — 歡迎畫面
Step 3 SHALL 顯示個人化歡迎訊息與靈人編號，並提供「開始使用」按鈕導向 `/dashboard`。

#### Scenario: 顯示靈人編號與歡迎訊息
- **WHEN** 用戶完成 Step 2 進入 Step 3
- **THEN** 頁面顯示「歡迎加入！您的靈人編號是 {spiritId}」與完成說明

#### Scenario: 點擊「開始使用」導向 Dashboard
- **WHEN** 用戶點擊「開始使用」按鈕
- **THEN** 系統導向 `/dashboard`

### Requirement: 版型採兩欄品牌樣式
`/onboarding` 頁面 SHALL 採用與 `/login`、`/register` 一致的兩欄品牌版型（lg 以上左側品牌區，右側表單）。

#### Scenario: 桌面版左側顯示品牌區
- **WHEN** 用戶在桌面（lg 以上）開啟 `/onboarding`
- **THEN** 左側顯示深色品牌區，右側顯示當前步驟表單

#### Scenario: 手機版全版顯示表單
- **WHEN** 用戶在手機開啟 `/onboarding`
- **THEN** 顯示全版表單，頂部有 Logo
