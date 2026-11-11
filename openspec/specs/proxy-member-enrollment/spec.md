# proxy-member-enrollment Specification

## Purpose
代填（未註冊）學員：老師／管理者可在學員本人尚未自行完成系統註冊前，先為其登記真實姓名、性別、所屬教會並直接加入班級，日後透過既有「帳號合併」機制與該學員自行註冊的真實帳號連結。

## Requirements

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

### Requirement: 建立代填學員對話框可捲動

「建立代填學員」對話框 SHALL 在視窗可視高度不足以完整顯示其內容時（例如小尺寸筆電螢幕），可透過整體向下捲動看到並操作到所有表單欄位與送出按鈕，不得因內容超出可視範圍而無法捲動。

#### Scenario: 小螢幕可視高度下仍可捲動到送出按鈕

- **WHEN** 操作者在可視高度較小的裝置（例如 MacBook Air 13.3" 解析度 2560x1600）開啟「建立代填學員」對話框，且對話框內容高度超出可視範圍
- **THEN** 操作者可在對話框內向下捲動，直到看到並點擊到最下方的送出按鈕與所有欄位

### Requirement: 建立代填學員真實姓名與教材姓名合併

「建立代填學員」路徑（`mode === 'proxy'`）SHALL 僅提供單一「真實姓名(教材姓名)」輸入欄位，不另外顯示獨立的教材所屬姓名欄位；送出建立代填學員時，SHALL 以該欄位的值同時作為真實姓名與（已選擇需訂購教材時的）教材所屬姓名。此合併規則 SHALL NOT 套用於「選擇既有會員」路徑（`mode === 'existing'`），該路徑的教材所屬姓名欄位 SHALL 維持獨立顯示與填寫。

#### Scenario: 代填學員僅需填寫一個姓名欄位

- **WHEN** 操作者於「建立代填學員」路徑選擇需訂購教材版本（非「已有教材」）並填寫真實姓名後送出
- **THEN** 系統建立的學員紀錄其真實姓名與教材所屬姓名皆採用操作者填寫的同一個姓名值，對話框中不存在第二個教材姓名輸入欄位

#### Scenario: 既有會員路徑的教材姓名欄位不受影響

- **WHEN** 操作者於「選擇既有會員」路徑選擇一名既有會員並選擇需訂購教材版本
- **THEN** 對話框仍顯示獨立的教材所屬姓名欄位，供操作者填寫與會員真實姓名不同的教材印製姓名
