## ADDED Requirements

### Requirement: 後台會員列表
`/admin/members` 頁面 SHALL 顯示所有會員清單，含姓名、Email、靈人編號、建立日期。

#### Scenario: 管理者進入會員管理頁
- **WHEN** admin/superadmin 進入 `/admin/members`
- **THEN** 顯示依建立時間倒序排列的會員清單

#### Scenario: 非管理者存取
- **WHEN** 非 admin/superadmin 使用者存取 `/admin/members`
- **THEN** 導向首頁（`/`）

### Requirement: 管理者重設會員密碼
管理者 SHALL 可對任一會員觸發密碼重設，系統生成臨時密碼並寄送至該會員信箱。

#### Scenario: 成功重設密碼
- **WHEN** 管理者點擊「重設密碼」並確認
- **THEN** 系統將該會員的 `passwordHash` 更新為新臨時密碼、`isTempPassword` 設為 `true`，並寄送臨時密碼通知信至該會員 Email

#### Scenario: 重設密碼需二次確認
- **WHEN** 管理者點擊「重設密碼」按鈕
- **THEN** 系統顯示確認提示，管理者需確認後才執行重設
