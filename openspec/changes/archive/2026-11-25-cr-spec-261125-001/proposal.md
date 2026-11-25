## Why

`/bc-version` 查詢工具目前只能讀到本機 dev 版本（`config/version.json`），無法確認正式環境（`https://activate.kuaglobal.org/`，實跑於 GCP `35.236.153.251`）與 test/staging 站（`https://project-a-stg.blockcode.com.tw`）實際部署的版本，因為 project_a 尚未實作 `/api/version` route，`projects.json` 也未設定對應網域。比照 bc-erp 的 `CR-SPEC-260813-002`（版本控制通用規則），補上後才能用統一工具跨環境比對版本。

## What Changes

- 新增 `/api/version` route（Route Handler），回傳 `config/version.json` 的 `{ version, updatedAt }` JSON。
- 將 `/api/version` 登記為免登入 API（`lib/auth/route-access.ts` 的 `PUBLIC_APIS`），因為查詢版本不需要身分驗證。
- 於 `~/.claude/skills/bc-version/projects.json` 的 `"project_a"` 項目補上 `prdUrl: "https://activate.kuaglobal.org"` 與 `testUrl: "https://project-a-stg.blockcode.com.tw"`。

## Capabilities

### New Capabilities
- `version-api`：對外公開的 `/api/version` 查詢端點，回傳目前部署版本與更新日期，供跨環境版本比對工具使用。

### Modified Capabilities

（無現有 capability 的需求變更；`route-access` 的清單異動屬於本次新增的 `version-api` capability 範圍內。）

## Impact

- 新檔案：`app/api/version/route.ts`（實際路徑依專案 App Router 慣例，見 `app/api/` 下既有 route 結構）。
- 修改：`lib/auth/route-access.ts`（`PUBLIC_APIS` 新增一筆）。
- 修改（非程式碼，跨機工具設定）：`~/.claude/skills/bc-version/projects.json`。
- 不影響資料庫 schema、不影響既有頁面行為。
