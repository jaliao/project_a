## ADDED Requirements

### Requirement: 外寄信件收件人解析通用規則
所有對使用者的外寄信件 SHALL 透過共用解析決定收件地址：當使用者 `isCommVerified` 為 true 且 `commEmail` 非空時，收件地址 SHALL 為 `commEmail`；否則 SHALL 退回帳號 `email`。系統 SHALL 提供共用純函式 `resolveContactEmail(user)` 實作此規則，供所有寄信點使用。

#### Scenario: 已驗證通訊 Email 優先
- **WHEN** 對某使用者寄送外寄信，且該使用者 `isCommVerified = true` 且 `commEmail` 非空
- **THEN** 收件地址為其 `commEmail`

#### Scenario: 未驗證通訊 Email 退回帳號 Email
- **WHEN** 對某使用者寄送外寄信，且 `isCommVerified = false` 或 `commEmail` 為空
- **THEN** 收件地址為其帳號 `email`

#### Scenario: 套用至臨時密碼與密碼重設信
- **WHEN** 系統寄送臨時密碼信（註冊／管理者重設）或密碼重設信
- **THEN** 收件地址依 `resolveContactEmail(user)` 決定

### Requirement: 通訊 Email 驗證信為解析規則例外
通訊 Email 驗證信 SHALL NOT 套用 `resolveContactEmail`，而是 SHALL 寄送至「待驗證的 `commEmail`」地址，否則使用者無法完成驗證。

#### Scenario: 驗證信寄至待驗證地址
- **WHEN** 使用者於 Profile 設定或重發通訊 Email 驗證信
- **THEN** 驗證信寄至該待驗證的 `commEmail`，即使其 `isCommVerified` 仍為 false
