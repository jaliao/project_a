## ADDED Requirements

### Requirement: 後台未啟用會員清單
後台 SHALL 提供「未啟用會員」查詢清單，列出從未登入過（`lastLoginAt` 為 null）的會員，供管理者（admin／superadmin）追蹤尚未設定自己帳號資料的會員。一般會員 SHALL NOT 存取此清單。

#### Scenario: 管理者檢視未啟用會員清單
- **WHEN** 管理者開啟未啟用會員清單頁
- **THEN** 頁面列出所有 `lastLoginAt` 為 null 的會員，顯示姓名、email、啟動編號、身分、建立時間與臨時密碼狀態

#### Scenario: 已登入過的會員不列入
- **WHEN** 某會員 `lastLoginAt` 非 null（曾登入過）
- **THEN** 該會員不出現在未啟用會員清單

#### Scenario: 無未啟用會員
- **WHEN** 系統中所有會員皆已登入過
- **THEN** 清單顯示空狀態（例如「目前無未啟用會員」）

#### Scenario: 非管理者不可存取
- **WHEN** 不具管理者身分的使用者嘗試開啟未啟用會員清單頁
- **THEN** 系統拒絕存取（無權限）
