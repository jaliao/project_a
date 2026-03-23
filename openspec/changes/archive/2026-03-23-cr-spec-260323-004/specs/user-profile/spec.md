## ADDED Requirements

### Requirement: 個人資料編輯
使用者 SHALL 可於 `/profile` 頁面查看與編輯個人基本資訊。

#### Scenario: 查看個人資料
- **WHEN** 已登入使用者進入 `/profile` 頁面
- **THEN** 頁面顯示 Spirit ID（唯讀）、真實姓名、手機號碼、收件地址、通訊 Email 及帳號連動狀態

#### Scenario: 成功更新個人資料
- **WHEN** 使用者修改真實姓名、手機號碼或收件地址並送出
- **THEN** 系統驗證格式，儲存變更，並顯示「儲存成功」提示

#### Scenario: 必填欄位為空
- **WHEN** 使用者嘗試儲存空白的真實姓名
- **THEN** 系統回傳驗證錯誤「真實姓名為必填」

### Requirement: Spirit ID 唯讀顯示
Profile 頁面 SHALL 顯示 Spirit ID 但不提供修改入口。

#### Scenario: Spirit ID 顯示為唯讀
- **WHEN** 使用者進入 Profile 頁面
- **THEN** Spirit ID 以唯讀文字顯示，無輸入框或編輯按鈕

### Requirement: 帳號連動狀態顯示
Profile 頁面 SHALL 顯示各第三方帳號（Google、LINE）的連動狀態，並提供對應操作入口。

#### Scenario: 已連結帳號顯示
- **WHEN** 使用者進入 Profile，且 Google 帳號已連結
- **THEN** 顯示「Google - 已連結」，並提供「解除連結」按鈕

#### Scenario: 未連結帳號顯示
- **WHEN** 使用者進入 Profile，且 Google 帳號未連結
- **THEN** 顯示「Google - 未連結」，並提供「連結帳號」按鈕

### Requirement: 未完成 Profile 提示
系統 SHALL 在使用者首次登入後（Profile 資料不完整時）顯示提示，引導完成資料填寫。

#### Scenario: 首次 Google 登入後引導
- **WHEN** Google OAuth 新用戶首次登入，`realName` 或 `phone` 為空
- **THEN** 系統導向 Profile 頁面並顯示「請完成個人資料填寫」提示橫幅
