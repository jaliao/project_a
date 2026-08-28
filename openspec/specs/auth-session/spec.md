# auth-session Specification

## Purpose
TBD - created by archiving change cr-spec-260828-011. Update Purpose after archive.
## Requirements
### Requirement: 失效的 JWT session 於下次請求即被撤銷

系統的 JWT 認證流程 SHALL 在每次「非初次登入」的請求中，以 token 內的使用者 id 向資料庫查核該使用者是否仍存在。

- 當查詢**成功且該 id 對應的使用者不存在**時，系統 SHALL 使該 JWT session 失效（jwt callback 回傳 `null`），使後續 `auth()` 取得的 session 為空。
- 當查詢**成功且使用者存在**時，系統 SHALL 依現行邏輯同步動態欄位（`roles`／`spiritId`／`isTempPassword`／`isProfileComplete`／`email`／頭像）並保留 session。
- 當查詢**本身拋出例外**（如資料庫連線失敗）時，系統 SHALL NOT 使 session 失效，SHALL 記錄錯誤並沿用既有 token（待下次請求再同步）。

session 失效後，受登入保護的頁面（`(user)` / `(admin)` route group）SHALL 由既有 layout 的 session 檢查將使用者重定向至 `/login`；受保護的 Server Action SHALL 以其既有的「未登入」處理拒絕操作。

#### Scenario: token 的 user id 已不存在 → session 失效並導回登入

- **WHEN** 使用者持有的 JWT 中 `id` 在 `users` 表已查無（例如開發環境重建資料庫、帳號被刪除、或跨環境的舊 cookie），且該使用者請求一個受登入保護的頁面
- **THEN** jwt callback 使 session 失效，`auth()` 回傳空 session，頁面 layout 將其重定向至 `/login`

#### Scenario: token 的 user id 已不存在 → Server Action 拒絕

- **WHEN** 上述失效 session 的使用者觸發一個需要登入的 Server Action
- **THEN** 該 Action 取得的 session 為空，回傳其「請先登入」之受控結果，不執行任何資料異動

#### Scenario: 使用者仍存在 → session 正常且欄位同步

- **WHEN** JWT 中的 `id` 對應的使用者仍存在，且其 `roles` 或 `spiritId` 在資料庫中已變更
- **THEN** session 保留有效，且回傳的 session 反映資料庫最新的 `roles`／`spiritId` 等欄位（無需重新登入）

#### Scenario: 資料庫查詢失敗 → 不誤把使用者登出

- **WHEN** jwt callback 中的使用者查詢因資料庫連線問題拋出例外
- **THEN** 系統記錄錯誤、沿用既有 token，該請求不因此回傳 500、使用者不被登出；待下次請求再行同步

#### Scenario: 一般有效 session 不受影響

- **WHEN** 使用者以有效帳號正常登入後瀏覽網站
- **THEN** 其 session 持續有效，行為與本變更前一致

