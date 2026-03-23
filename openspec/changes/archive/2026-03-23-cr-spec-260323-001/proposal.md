## Why

此為專案從 `bc_erp` 遷移至 `project_a`（啟動靈人系統）後的首次初始化。目前所有設定檔仍殘留舊專案名稱，導致開發環境無法正確識別，需全面替換並確保 `make dev` 可在本機一鍵啟動。

## What Changes

- 將所有 `bc-erp` / `bc_erp` / `BC-ERP` 字串替換為 `project_a` / `啟動靈人系統`
- 更新 `Makefile`：`PROJECT_NAME`、標題文字、DB 名稱（`bc-erp-db` → `project_a_db`）
- 更新 `package.json`：`name` 欄位 `bc-erp` → `project_a`
- 更新 `CLAUDE.md`：專案名稱與說明文字
- 更新 `docker-compose.yml` / `docker-compose.dev.yml`：確認環境變數對應正確
- 驗證 `make dev` 可完整啟動（Docker DB + Next.js dev server）
- 移除 `tunnel-deploy` 中的 `bcerp` 硬編碼路徑（或標記為待更新）

## Capabilities

### New Capabilities
- `project-init`: 專案識別初始化 — 替換所有舊名稱、確保本機開發環境可用

### Modified Capabilities
<!-- 無現有 spec 需修改 -->

## Impact

- `Makefile` — PROJECT_NAME、DB 名稱、help 標題、tunnel-deploy script 路徑
- `package.json` — name 欄位
- `CLAUDE.md` — 專案說明
- `docker-compose.yml` — POSTGRES_DB 環境變數（透過 .env 控制，需確認 .env.example）
- 開發者首次 clone 後執行 `make dev` 的體驗
