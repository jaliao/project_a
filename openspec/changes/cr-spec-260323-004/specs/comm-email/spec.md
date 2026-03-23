## ADDED Requirements

### Requirement: 通訊 Email 獨立於登入帳號
系統 SHALL 區分「登入帳號 Email」（唯一、不可變）與「通訊 Email」（可修改、需驗證）。

#### Scenario: 登入帳號 Email 不可修改
- **WHEN** 使用者嘗試透過任何途徑修改登入用的 Email
- **THEN** 系統拒絕該操作，登入 Email 保持不變

#### Scenario: 通訊 Email 初始狀態
- **WHEN** 新帳號建立後（Email 或 Google 註冊）
- **THEN** `commEmail` 預設為空值，`isCommVerified = false`

### Requirement: 通訊 Email 變更與驗證
使用者 SHALL 可於 Profile 設定通訊 Email，變更後 SHALL 重新觸發驗證流程。

#### Scenario: 首次設定通訊 Email
- **WHEN** 使用者於 Profile 頁面輸入通訊 Email 並儲存
- **THEN** 系統更新 `commEmail`，將 `isCommVerified` 設為 `false`，並發送驗證信至新地址

#### Scenario: 更改現有通訊 Email
- **WHEN** 使用者修改已設定的通訊 Email 為新地址
- **THEN** 系統更新 `commEmail`，將 `isCommVerified` 重置為 `false`，並發送驗證信至新地址

#### Scenario: 點擊驗證連結完成驗證
- **WHEN** 使用者點擊發送至通訊 Email 的有效驗證連結
- **THEN** 系統將 `isCommVerified` 更新為 `true`

#### Scenario: 驗證連結過期
- **WHEN** 使用者點擊超過 24 小時的驗證連結
- **THEN** 系統回傳「連結已失效」，並提供重新發送驗證信的入口

### Requirement: 通訊 Email 驗證狀態顯示
系統 SHALL 在 Profile 頁面清楚顯示通訊 Email 的驗證狀態。

#### Scenario: 未驗證狀態顯示
- **WHEN** 使用者進入 Profile 頁面且 `isCommVerified = false`
- **THEN** 頁面顯示「未驗證」標示，並提供「重發驗證信」按鈕
