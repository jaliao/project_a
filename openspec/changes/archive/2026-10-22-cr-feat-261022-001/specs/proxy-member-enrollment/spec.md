## ADDED Requirements

### Requirement: 代填學員欄位

`User` SHALL 新增 `isProxyMember Boolean @default(false)` 欄位，標記該帳號是否為管理者／老師代填建立、該學員本人尚未自行完成註冊。既有會員（既有資料）SHALL 維持 `false`，不受影響。

#### Scenario: 既有會員預設非代填
- **WHEN** 查詢任一在本次變更前已存在的 `User`
- **THEN** 其 `isProxyMember` 為 `false`

#### Scenario: 代填學員建立時標記為真
- **WHEN** 管理者或老師透過「建立代填學員」流程建立一筆 `User`
- **THEN** 該筆 `User.isProxyMember` 為 `true`

### Requirement: 代填學員結構上無法登入與被聯絡

代填學員建立時，`email`、`passwordHash` SHALL 皆為 `null`，且 SHALL NOT 建立任何 `Account` 記錄。系統 SHALL NOT 為代填學員另寫登入阻擋邏輯——其無法通過 Credentials 或 Google OAuth 登入，純粹是結構上缺少必要憑證所致，與既有「尚未完成註冊」狀態一致。

#### Scenario: 代填學員無法以密碼登入
- **WHEN** 任何人嘗試以代填學員的身分資料嘗試密碼登入
- **THEN** 因 `passwordHash` 為 `null`，登入失敗，與既有「尚未設定密碼」帳號的行為一致

#### Scenario: 代填學員無法以 Google 登入
- **WHEN** 任何人嘗試以代填學員身分透過 Google OAuth 登入
- **THEN** 因無對應 `Account` 記錄，系統視為全新登入嘗試，不會關聯到該代填學員帳號

#### Scenario: 代填學員不會收到任何系統信件
- **WHEN** 系統任何寄信流程查詢到收件人為 `email = null` 的代填學員
- **THEN** 依既有寄信防呆邏輯略過寄送，不拋出例外

### Requirement: 代填學員資料範圍限制

建立代填學員時，系統 SHALL 僅收集真實姓名（`realName`，必填）、性別（`gender`，選填，預設 `unspecified`）、所屬教會（`churchType`／`churchId`／`churchOther`，選填，預設 `none`）。系統 SHALL NOT 於此流程收集或要求填寫 Email、電話、暱稱等任何可用於登入或聯絡的欄位。

#### Scenario: 僅需填寫真實姓名即可建立
- **WHEN** 操作者僅填寫真實姓名、未填性別與教會，送出「建立代填學員」
- **THEN** 系統成功建立該代填學員（性別為 `unspecified`、`churchType = none`）

#### Scenario: 未填真實姓名被拒絕
- **WHEN** 操作者未填寫真實姓名即嘗試送出「建立代填學員」
- **THEN** 系統拒絕並回傳欄位錯誤，不建立任何帳號
