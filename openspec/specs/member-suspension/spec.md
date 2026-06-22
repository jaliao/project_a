# member-suspension Specification

## Purpose
TBD - created by archiving change cr-spec-260621-005. Update Purpose after archive.
## Requirements
### Requirement: 會員暫停資料模型
`User` SHALL 具備暫停相關欄位：`suspendedAt`（暫停時間，null 表示未暫停）、`suspendedById`（執行暫停的管理者）、`suspendReason`（enum `SuspendReason`：`password_leak`／`user_request`／`other`）、`suspendReasonNote`（自填補充）。`suspendedAt != null` SHALL 視為暫停中。

#### Scenario: 暫停中判定
- **WHEN** 某會員 `suspendedAt` 非 null
- **THEN** 系統視其為「暫停中」

### Requirement: 暫停會員操作
管理者 SHALL 能暫停指定會員，系統 SHALL 記錄暫停時間、操作人員（當前管理者）與原因。原因 SHALL 為下拉選項（密碼外洩 `password_leak`／使用者要求 `user_request`／其他原因 `other`），並可自行填寫補充說明；選擇 `other` 時補充說明 SHALL 為必填。

#### Scenario: 暫停成功並記錄
- **WHEN** 管理者對某會員選擇原因並送出暫停
- **THEN** 寫入 `suspendedAt`（當前時間）、`suspendedById`（當前管理者）、`suspendReason`、`suspendReasonNote`，該會員進入暫停中

#### Scenario: 其他原因未填補充說明
- **WHEN** 暫停原因選 `other` 但補充說明為空
- **THEN** 回傳失敗並提示需填寫原因，不暫停

#### Scenario: 非管理者不可暫停
- **WHEN** 非 `canAccessAdmin` 的使用者呼叫暫停
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 被暫停會員無法登入
被暫停會員（`suspendedAt != null`）SHALL 無法登入：Credentials 與 Google 登入皆 SHALL 被拒絕並提示帳號已暫停；既有有效 session 於後續請求時 SHALL 被擋下並導向帶暫停提示之頁面。

#### Scenario: 暫停會員嘗試登入
- **WHEN** 被暫停會員嘗試以 Email/密碼或 Google 登入
- **THEN** 系統拒絕登入並顯示帳號已暫停（不建立 session）

#### Scenario: 既有 session 於暫停後被擋
- **WHEN** 會員在已登入狀態下被暫停，之後發出任一受保護請求
- **THEN** 系統擋下並導向帶暫停提示之頁面（如 `/login?error=Suspended`）

### Requirement: 恢復會員
管理者 SHALL 能恢復被暫停會員，清空暫停欄位（`suspendedAt`／`suspendedById`／`suspendReason`／`suspendReasonNote`），恢復後該會員 SHALL 能正常登入。

#### Scenario: 恢復成功
- **WHEN** 管理者對暫停中會員點「恢復會員」
- **THEN** 清空暫停欄位，該會員恢復為可登入狀態

#### Scenario: 詳情頁顯示暫停資訊
- **WHEN** 管理者檢視暫停中會員的特殊設定分頁
- **THEN** 顯示暫停時間、操作人員、原因（與補充說明），並提供「恢復會員」操作

