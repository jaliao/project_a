## MODIFIED Requirements

### Requirement: 首次登入強制變更密碼
系統 SHALL 偵測使用者以臨時密碼登入，並強制於完成 Onboarding 流程前阻擋所有受保護路由的存取。守衛 SHALL 在 RSC Layout 層（Node.js runtime）執行，直接讀取 DB 以確保 `isTempPassword` 狀態永遠是最新值，不依賴可能過期的 JWT cache。

#### Scenario: 使用臨時密碼登入後被攔截
- **WHEN** 使用者以臨時密碼成功登入，且 `isTempPassword = true`
- **THEN** 系統強制導向 `/onboarding` 頁面，所有受保護路由均觸發重新導向

#### Scenario: 臨時密碼變更成功
- **WHEN** 使用者於 Onboarding Wizard 完成密碼設定（Step 1）
- **THEN** 系統更新密碼 hash，將 `isTempPassword` 設為 `false`，Wizard 進入下一步驟

#### Scenario: 新密碼與臨時密碼相同
- **WHEN** 使用者輸入的新密碼與目前臨時密碼相同
- **THEN** 系統拒絕並回傳錯誤「新密碼不可與臨時密碼相同」

#### Scenario: 已完成 Onboarding 的用戶不被攔截
- **WHEN** `isTempPassword = false` 且 Profile 已完整的使用者存取受保護路由
- **THEN** 系統正常放行，不強制導向 Onboarding 頁面

#### Scenario: Onboarding 完成後可正常進入 Dashboard
- **WHEN** 使用者完成 Onboarding Wizard 所有步驟後點擊「開始使用」
- **THEN** 系統導向 `/dashboard`，RSC Layout 讀 DB 確認狀態，不產生重新導向迴圈
