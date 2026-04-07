## MODIFIED Requirements

### Requirement: 首次登入強制變更密碼
系統 SHALL 偵測使用者以臨時密碼登入，並強制於完成 Onboarding Wizard 前阻擋所有其他操作。

#### Scenario: 使用臨時密碼登入後被攔截
- **WHEN** 使用者以臨時密碼成功登入，且 `isTempPassword = true`
- **THEN** 系統強制導向 `/onboarding`（原為 `/change-password`），所有其他路由均回傳重新導向

#### Scenario: 臨時密碼變更成功
- **WHEN** 使用者於 Onboarding Wizard Step 1 輸入符合規則的新密碼並確認
- **THEN** 系統更新密碼 hash，將 `isTempPassword` 設為 `false`，Wizard 進入 Step 2

#### Scenario: 新密碼與臨時密碼相同
- **WHEN** 使用者輸入的新密碼與目前臨時密碼相同
- **THEN** 系統拒絕並回傳錯誤「新密碼不可與臨時密碼相同」

#### Scenario: 已變更密碼的用戶不被攔截
- **WHEN** `isTempPassword = false` 的使用者正常登入
- **THEN** 系統正常放行，不強制導向 Onboarding
