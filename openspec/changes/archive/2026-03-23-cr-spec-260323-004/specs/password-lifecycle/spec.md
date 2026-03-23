## ADDED Requirements

### Requirement: 首次登入強制變更密碼
系統 SHALL 偵測使用者以臨時密碼登入，並強制於完成密碼變更前阻擋所有其他操作。

#### Scenario: 使用臨時密碼登入後被攔截
- **WHEN** 使用者以臨時密碼成功登入，且 `isTempPassword = true`
- **THEN** 系統強制導向 `/change-password` 頁面，所有其他路由均回傳重新導向

#### Scenario: 臨時密碼變更成功
- **WHEN** 使用者於 `/change-password` 頁面輸入符合規則的新密碼並確認
- **THEN** 系統更新密碼 hash，將 `isTempPassword` 設為 `false`，並導向 Profile 或首頁

#### Scenario: 新密碼與臨時密碼相同
- **WHEN** 使用者輸入的新密碼與目前臨時密碼相同
- **THEN** 系統拒絕並回傳錯誤「新密碼不可與臨時密碼相同」

#### Scenario: 已變更密碼的用戶不被攔截
- **WHEN** `isTempPassword = false` 的使用者正常登入
- **THEN** 系統正常放行，不強制導向變更密碼頁面

### Requirement: 密碼格式規則
使用者設定的新密碼 SHALL 符合最低強度要求。

#### Scenario: 密碼長度不足
- **WHEN** 使用者提交長度少於 8 字元的密碼
- **THEN** 系統回傳驗證錯誤「密碼至少需 8 字元」

### Requirement: 忘記密碼流程
系統 SHALL 提供密碼重設機制，使用者輸入 Email 後取得含加密 token 的重設連結。

#### Scenario: 輸入已存在 Email 申請重設
- **WHEN** 使用者於 `/forgot-password` 頁面輸入已存在帳號的 Email 並送出
- **THEN** 系統生成一次性 token（TTL 1 小時），發送密碼重設連結至該 Email

#### Scenario: 輸入不存在 Email
- **WHEN** 使用者輸入系統中不存在的 Email
- **THEN** 系統回傳相同提示（「若此 Email 已註冊，將發送重設信」），不洩漏帳號存在與否

#### Scenario: 點擊有效重設連結
- **WHEN** 使用者點擊有效且未過期的重設連結
- **THEN** 系統驗證 token，允許使用者設定新密碼，設定成功後 token 立即失效

#### Scenario: 點擊過期或已使用連結
- **WHEN** 使用者點擊已過期（超過 1 小時）或已使用的重設連結
- **THEN** 系統回傳錯誤「連結已失效，請重新申請」
