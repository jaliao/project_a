# app-url-helpers Specification

## Purpose
TBD - created by archiving change cr-spec-260629-005. Update Purpose after archive.
## Requirements
### Requirement: 對外網址建構單一來源
系統 SHALL 以 `lib/utils/app-url.ts` 為對外絕對網址建構的單一來源，提供 `getAppUrl()`（無 request 情境，讀 `NEXTAUTH_URL`）與 `getRequestBaseUrl(req)`（route handler 導向，依轉發標頭還原對外 base）。所有對外網址 SHALL 透過此二函式建構。

#### Scenario: 寄信連結以 getAppUrl 建構
- **WHEN** server action 需產生對外連結（驗證信、密碼重設、課程邀請）
- **THEN** 以 `getAppUrl()` 取得對外 base 組成連結，不直接字串拼接 `process.env.NEXTAUTH_URL`

#### Scenario: route handler 導向以 getRequestBaseUrl 建構
- **WHEN** route handler 需導向自身站點路徑（如 verify-email、suspended-logout）
- **THEN** 以 `getRequestBaseUrl(req)` 取得對外 base，導向使用該 base

### Requirement: route handler 不得以 req.url 建對外網址
route handler SHALL NOT 以 `req.url` 或 `req.nextUrl.origin` 作為對外導向的 base（開發 tunnel 下會取到內部 localhost）；MUST 改用 `getRequestBaseUrl(req)`。

#### Scenario: tunnel 下導向使用對外網域
- **WHEN** 請求經 Cloudflare Tunnel（`x-forwarded-host` 為對外網域、內部 host 為 localhost）抵達 route handler 並觸發導向
- **THEN** 導向目標使用對外網域（`x-forwarded-host`），不落在 `localhost`

#### Scenario: 轉發標頭缺失時回退
- **WHEN** 無 `x-forwarded-host`
- **THEN** 依序回退 `host` → `NEXTAUTH_URL` → `req.nextUrl.origin`，仍能組出可用 base

### Requirement: 開發準則載明網址建構規範
專案開發準則（`CLAUDE.md`）SHALL 載明：對外網址一律用 `lib/utils/app-url.ts` 的 helper；route handler 禁止用 `req.url`/`req.nextUrl.origin` 建對外網址。

#### Scenario: 準則可查
- **WHEN** 開發者查閱 `CLAUDE.md`
- **THEN** 可找到對外網址建構與 route handler 禁用 `req.url` 的規範

