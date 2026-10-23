## ADDED Requirements

### Requirement: 代填學員邀請 Email 管理

會員詳情頁「特殊設定」分頁 SHALL 在該會員 `isProxyMember = true` 時，新增「邀請 Email」欄位（可編輯）與「補發邀請」按鈕，僅 `canAccessAdmin` 的使用者可使用。編輯 email 或點擊「補發邀請」皆 SHALL 依 `proxy-invite` 能力的規則核發新 token 並重新寄信、使該使用者先前所有未使用的 token 失效。`isProxyMember = false` 的會員 SHALL NOT 顯示此區塊。

#### Scenario: 代填學員顯示邀請 Email 管理區塊
- **WHEN** 管理者開啟一筆 `isProxyMember = true` 帳號的詳情頁特殊設定分頁
- **THEN** 顯示「邀請 Email」欄位（可編輯）與「補發邀請」按鈕

#### Scenario: 一般會員不顯示此區塊
- **WHEN** 管理者開啟一筆 `isProxyMember = false` 帳號的詳情頁特殊設定分頁
- **THEN** 不顯示「邀請 Email」管理區塊

#### Scenario: 修改邀請 Email 並重新寄信
- **WHEN** 管理者將邀請 Email 改為一個未被使用的新值並儲存
- **THEN** 系統更新 `User.email`、作廢該使用者先前未使用的 token、核發新 token 並寄出邀請信

#### Scenario: 點擊補發邀請
- **WHEN** 管理者對已有邀請 Email 的代填學員點擊「補發邀請」（未修改 email）
- **THEN** 系統作廢先前未使用的 token、核發新 token 並以目前 email 重新寄信

#### Scenario: 修改為已被使用的 Email
- **WHEN** 管理者將邀請 Email 改為已被其他帳號使用的值並嘗試儲存
- **THEN** 系統拒絕並顯示「此 Email 已被使用」，不作廢既有 token、不變更 `User.email`

#### Scenario: 非管理者無法操作
- **WHEN** 不具 `canAccessAdmin` 的使用者嘗試呼叫邀請 Email 編輯或補發邀請的 Server Action
- **THEN** 系統拒絕並回傳無權限訊息，不執行任何資料異動
