# login-activity-tracking Specification

## Purpose
TBD - created by archiving change cr-spec-260622-002. Update Purpose after archive.
## Requirements
### Requirement: 登入成功時記錄登入時間
系統 SHALL 於每次登入成功（Google OAuth 與 Credentials 皆適用）時，將該會員的 `lastLoginAt` 更新為當下時間，並先把更新前的 `lastLoginAt` 平移至 `previousLoginAt`。此平移 SHALL 為原子操作（單一資料庫語句以欄位對欄位賦值），避免同帳號併發登入造成競態。

登入時間更新 SHALL NOT 阻斷登入流程：若更新失敗，系統僅記錄錯誤，仍允許登入完成。

#### Scenario: 首次登入寫入 lastLoginAt
- **WHEN** 一位 `lastLoginAt` 為 null 的會員首次成功登入
- **THEN** 系統將其 `lastLoginAt` 設為當下時間，`previousLoginAt` 保持 null

#### Scenario: 再次登入平移時間點
- **WHEN** 一位已有 `lastLoginAt` 的會員再次成功登入
- **THEN** 系統將更新前的 `lastLoginAt` 寫入 `previousLoginAt`，再把 `lastLoginAt` 設為當下時間

#### Scenario: Google 與 Credentials 皆記錄
- **WHEN** 會員以 Google OAuth 或 Email＋密碼任一方式成功登入
- **THEN** 兩種登入方式皆觸發相同的登入時間平移與更新

#### Scenario: 登入時間更新失敗不阻斷登入
- **WHEN** 登入時間更新的資料庫操作發生錯誤
- **THEN** 系統記錄錯誤但仍讓該次登入成功完成

#### Scenario: 被暫停會員不更新登入時間
- **WHEN** 一位 `suspendedAt` 不為 null 的會員嘗試登入
- **THEN** 系統依既有暫停守衛拒絕登入，且 SHALL NOT 更新其登入時間

