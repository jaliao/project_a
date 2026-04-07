## MODIFIED Requirements

### Requirement: Profile 路由排除在轉導之外
系統 SHALL 不對 Profile 頁面及 Onboarding 頁面本身執行轉導，以防止無限迴圈。

#### Scenario: 存取 Profile 頁時不觸發轉導
- **WHEN** 強制轉導模式啟用，且使用者目前路徑包含 `/profile`
- **THEN** 系統不執行轉導，正常顯示 Profile 頁面

#### Scenario: 存取 Onboarding 頁時不觸發轉導
- **WHEN** 強制轉導模式啟用，且使用者目前路徑為 `/onboarding`
- **THEN** 系統不執行轉導（Onboarding Wizard 本身引導用戶完成資料填寫）
