## MODIFIED Requirements

### Requirement: 代填學員資料範圍限制

建立代填學員時，系統 SHALL 僅收集真實姓名（`realName`，必填）、性別（`gender`，選填，預設 `unspecified`）、所屬教會（`churchType`／`churchId`／`churchOther`，選填，預設 `none`）、以及**選填的邀請 email**。系統 SHALL NOT 於此流程收集或要求填寫電話、暱稱等任何其他可用於登入或聯絡的欄位。

填寫邀請 email 時，系統 SHALL 檢查其唯一性（不可與既有任一 `User.email` 重複），衝突時 SHALL 拒絕整筆建立並回傳欄位錯誤，不建立任何帳號；通過檢查則 SHALL 將該 email 寫入新建立的 `User.email`，並依 `proxy-invite` 能力核發邀請 token 與寄送邀請信。未填寫 email 時，行為與本能力變更前完全一致（`email` 為 `null`，不寄信）。

#### Scenario: 僅需填寫真實姓名即可建立
- **WHEN** 操作者僅填寫真實姓名、未填性別、教會與 email，送出「建立代填學員」
- **THEN** 系統成功建立該代填學員（性別為 `unspecified`、`churchType = none`、`email = null`），不寄送任何邀請信

#### Scenario: 未填真實姓名被拒絕
- **WHEN** 操作者未填寫真實姓名即嘗試送出「建立代填學員」
- **THEN** 系統拒絕並回傳欄位錯誤，不建立任何帳號

#### Scenario: 填寫邀請 Email 建立並立即寄出邀請信
- **WHEN** 操作者填寫真實姓名與一個未被使用的 email，送出「建立代填學員」
- **THEN** 系統成功建立該代填學員（`email` 為填寫值），核發一筆 `ProxyInviteToken` 並寄出邀請信

#### Scenario: 填寫的邀請 Email 已被使用
- **WHEN** 操作者填寫的 email 已被其他既有 `User` 使用
- **THEN** 系統拒絕整筆建立並回傳欄位錯誤「此 Email 已被使用」，不建立任何帳號、不核發 token、不寄信
