## ADDED Requirements

### Requirement: 對外公開的版本查詢端點

系統 SHALL 提供 `GET /api/version` 端點，回傳目前部署版本資訊的 JSON，欄位為 `config/version.json` 的 `version`（SemVer 字串）與 `updatedAt`（`YYYY-MM-DD`）。此端點 SHALL 免登入即可存取（登記於 `lib/auth/route-access.ts` 的 `PUBLIC_APIS`）。

#### Scenario: 查詢目前部署版本

- **WHEN** 任何使用者或工具對 `/api/version` 發送 `GET` 請求
- **THEN** 回應 HTTP 200，body 為 JSON，格式為 `{ "version": "<config/version.json 的 version>", "updatedAt": "<config/version.json 的 updatedAt>" }`

#### Scenario: 未登入可直接查詢

- **WHEN** 未帶任何登入 session 的請求呼叫 `/api/version`
- **THEN** 不被導向登入頁，直接回傳版本 JSON（與已登入時行為一致）

### Requirement: 跨環境版本比對工具可查詢本專案

`~/.claude/skills/bc-version/projects.json` 的 `"project_a"` 項目 SHALL 設定 `prdUrl` 為正式環境對外網域，`testUrl` 為 test/staging 站對外網域，使 `/bc-version project_a` 可同時查得 dev／test／prd 三環境版本。

#### Scenario: 查詢三環境版本比對表

- **WHEN** 使用者執行 `/bc-version project_a`
- **THEN** 輸出的 test 欄位改以 `GET {testUrl}/api/version` 取得版本（不再顯示「尚未建置」），prd 欄位改以 `GET {prdUrl}/api/version` 取得版本（不再顯示「尚未接上 /api/version」）
