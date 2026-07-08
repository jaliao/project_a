# footer-version-info Delta Specification

## ADDED Requirements

### Requirement: Footer 顯示版本與系統更新日期
登入後頁面（`(user)` 與 `(admin)` route group）SHALL 於頁面底部 Footer 顯示目前系統版本號與系統更新日期，格式為 `v{version} · {updatedAt}`（如 `v0.1.129 · 2026-07-08`）。資料源 SHALL 為 `config/version.json` 的 `version` 與 `updatedAt` 欄位；免登入頁 SHALL NOT 顯示此 Footer。

#### Scenario: 登入後頁面可見版本 Footer
- **WHEN** 已登入使用者開啟任一使用者端或後台頁面
- **THEN** 頁面底部顯示 `v{版本號} · {更新日期}`

#### Scenario: 免登入頁不顯示
- **WHEN** 未登入使用者開啟登入頁或其他免登入頁
- **THEN** 頁面不顯示版本 Footer

### Requirement: 更新日期隨版本遞增同步維護
`config/version.json` SHALL 含 `updatedAt`（`YYYY-MM-DD`）欄位；每次版本 patch +1 時 SHALL 同步更新 `updatedAt` 為當日日期。

#### Scenario: 版本遞增同步日期
- **WHEN** 套用變更使 `version` 由 `0.1.128` 遞增為 `0.1.129`
- **THEN** `updatedAt` 同步更新為套用當日日期，Footer 顯示新版本與新日期
