# i18n-routing Specification

## Purpose
TBD - created by archiving change cr-spec-260629-004. Update Purpose after archive.
## Requirements
### Requirement: Locale 前綴路由
系統 SHALL 以 next-intl 提供 locale 前綴路由，支援 `zh-TW`（預設）、`en`、`zh-CN`，採 `as-needed` 策略：預設語言 `zh-TW` 不帶前綴、其餘語言帶前綴（`/en`、`/zh-cn`）。所有頁面路由 SHALL 置於 `app/[locale]/` 之下；`app/api/*` SHALL NOT 在地化。

#### Scenario: 預設語言不帶前綴
- **WHEN** 使用者開啟 `/`（或任一頁）未帶 locale 前綴
- **THEN** 以預設 `zh-TW` 呈現，URL 不變（與導入前相同）

#### Scenario: 其他語言帶前綴
- **WHEN** 使用者開啟 `/en` 或 `/zh-cn` 下的頁面
- **THEN** 分別以英文／簡體呈現

#### Scenario: API 不在地化
- **WHEN** 請求 `/api/*`
- **THEN** 不套用 locale 前綴或語言改寫

### Requirement: HTML lang 在地化
`<html lang>` SHALL 反映當前 locale（由 `app/[locale]/layout.tsx` 設定），不再寫死 `zh-TW`。

#### Scenario: lang 隨語言改變
- **WHEN** 當前語言為 en
- **THEN** 頁面 `<html lang="en">`

### Requirement: Middleware 組合（語言 + 認證）
Middleware SHALL 將 next-intl 語言協商/前綴處理與既有認證守衛組合：先處理 locale，再以 locale-無關路徑（經 `stripLocale`）套用 `route-access` 的免登入/訪客判定。語言處理 SHALL NOT 破壞既有未登入導向 `/login` 的行為。

#### Scenario: 未登入存取受保護頁（任一語言）
- **WHEN** 未登入使用者存取 `/en/dashboard`
- **THEN** 經 locale 處理後仍被導向登入（保留語言情境）

#### Scenario: 免登入頁在任一語言放行
- **WHEN** 未登入使用者存取 `/en/login` 或 `/zh-cn/login`
- **THEN** 放行（`isPublicRoute` 以 stripLocale 後路徑判定為公開）

### Requirement: 語言協商與偏好
系統 SHALL 在未指定語言時依使用者偏好（`NEXT_LOCALE` cookie，其次 Accept-Language）協商語言，並回退至預設 `zh-TW`。

#### Scenario: 依 cookie 偏好
- **WHEN** 使用者先前選過 en（已寫入偏好）且開啟未帶前綴路徑
- **THEN** 依 next-intl 設定的協商行為呈現其偏好語言

#### Scenario: 無偏好回退預設
- **WHEN** 無語言偏好且 Accept-Language 不含支援語言
- **THEN** 以預設 `zh-TW` 呈現

