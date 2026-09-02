# footer-version-info Delta（cr-spec-260902-002）

## MODIFIED Requirements

### Requirement: Footer 顯示版本與系統更新日期

系統 SHALL 於**共用 Footer 的底部列**（見 `site-footer`）顯示目前系統版本號與系統更新日期，格式為 `v{version} · {updatedAt}`（如 `v0.1.196 · 2026-09-02`），與版權、法律連結同列呈現。資料源 SHALL 為 `config/version.json` 的 `version` 與 `updatedAt` 欄位。

版本資訊 SHALL 隨共用 Footer 出現於：所有登入後頁面（`(user)`／`(admin)` route group）**以及**公開行銷頁（`/`、`/courses`、`/terms`、`/privacy`）。表單類免登入頁（登入／註冊／找回帳號等，不渲染共用 Footer）SHALL NOT 顯示版本資訊。

#### Scenario: 登入後頁面可見版本資訊

- **WHEN** 已登入使用者開啟任一使用者端或後台頁面
- **THEN** 頁面底部 Footer 的底部列顯示 `v{版本號} · {更新日期}`

#### Scenario: 公開行銷頁可見版本資訊

- **WHEN** 未登入使用者開啟 `/`、`/courses`、`/terms` 或 `/privacy`
- **THEN** 頁面底部共用 Footer 的底部列顯示 `v{版本號} · {更新日期}`

#### Scenario: 表單類免登入頁不顯示

- **WHEN** 未登入使用者開啟登入頁或註冊頁
- **THEN** 頁面不顯示共用 Footer，亦不顯示版本資訊

### Requirement: 更新日期隨版本遞增同步維護

`config/version.json` SHALL 含 `updatedAt`（`YYYY-MM-DD`）欄位；每次版本 patch +1 時 SHALL 同步更新 `updatedAt` 為當日日期。

#### Scenario: 版本遞增同步日期

- **WHEN** 套用變更使 `version` 由 `0.1.128` 遞增為 `0.1.129`
- **THEN** `updatedAt` 同步更新為套用當日日期，Footer 顯示新版本與新日期
