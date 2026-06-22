# account-suspended-page Specification

## Purpose
TBD - created by archiving change cr-spec-260622-001. Update Purpose after archive.
## Requirements
### Requirement: 獨立的帳號已暫停頁面
系統 SHALL 提供獨立公開頁面 `/account-suspended`，顯示帳號已被暫停、無法登入的提示與聯繫管理員指引，並提供「重新登入」連結。此頁 SHALL NOT 與登入表單共用同一頁（不再使用 `/login?error=Suspended`）。此頁 SHALL 可免登入瀏覽（列入公開路徑）。

#### Scenario: 顯示暫停提示
- **WHEN** 任何人瀏覽 `/account-suspended`
- **THEN** 顯示「此帳號已被暫停，無法登入，請聯繫管理員」之提示與「重新登入」連結

#### Scenario: 免登入可見
- **WHEN** 未登入訪客直接開啟 `/account-suspended`
- **THEN** 正常顯示該頁（不被導向 `/login`）

### Requirement: 重新登入為整頁載入
`/account-suspended` 的「重新登入」SHALL 為一般連結（整頁導覽）連向 `/login`，使登入頁以乾淨的頁面與 CSRF 脈絡載入，避免沿用先前分頁殘留的前端狀態。

#### Scenario: 點重新登入回到乾淨登入頁
- **WHEN** 使用者於 `/account-suspended` 點「重新登入」
- **THEN** 瀏覽器整頁導覽至 `/login`，登入表單為全新狀態

#### Scenario: 恢復後可直接登入
- **WHEN** 帳號已被管理者恢復，使用者經「重新登入」到 `/login` 並輸入正確帳密
- **THEN** 登入成功，無需手動重新整理或修改網址

### Requirement: 暫停封鎖一律導向獨立頁
被暫停帳號的封鎖 SHALL 一致導向 `/account-suspended`：
- 既有 session 於暫停後存取受保護頁時 SHALL 經清除 session 的流程後導向 `/account-suspended`。
- 被暫停帳號的登入嘗試（Credentials／Google）於 signIn 守衛 SHALL 導向 `/account-suspended`，且不建立 session。

#### Scenario: 既有 session 被暫停
- **WHEN** 登入中使用者被暫停後存取任一受保護頁
- **THEN** 系統清除其 session 並導向 `/account-suspended`

#### Scenario: 被暫停帳號嘗試登入
- **WHEN** 被暫停帳號於 `/login` 送出正確帳密
- **THEN** signIn 守衛阻擋並導向 `/account-suspended`（不建立 session）

### Requirement: 登入頁不再承載暫停狀態
登入表單頁 SHALL NOT 依 `?error=Suspended` 顯示暫停橫幅或執行任何暫停相關邏輯；登入頁回歸單純登入用途。

#### Scenario: 登入頁無暫停殘留
- **WHEN** 使用者開啟 `/login`
- **THEN** 頁面不顯示暫停橫幅，登入流程不受任何暫停參數影響

