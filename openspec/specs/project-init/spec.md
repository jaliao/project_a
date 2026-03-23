## ADDED Requirements

### Requirement: 專案識別名稱統一替換
所有設定檔與說明文件中的舊專案名稱（`bc-erp`、`bc_erp`、`BC-ERP`）SHALL 替換為新名稱（`project_a`、`啟動靈人系統`），確保新開發者 clone 後不會看到任何舊名稱殘留。

#### Scenario: package.json name 欄位已更新
- **WHEN** 開發者讀取 `package.json`
- **THEN** `name` 欄位值 SHALL 為 `"project_a"`，不含 `bc-erp`

#### Scenario: Makefile PROJECT_NAME 已更新
- **WHEN** 開發者執行 `make help`
- **THEN** 輸出標題 SHALL 顯示 `project_a` 相關名稱，不含 `BC-ERP` 或 `bc-erp`

#### Scenario: Makefile DB 名稱已更新
- **WHEN** 開發者讀取 Makefile 中的 DB 相關變數
- **THEN** DB 名稱 SHALL 為 `project_a_db`，不含 `bc-erp-db`

#### Scenario: CLAUDE.md 專案說明已更新
- **WHEN** 開發者讀取 `CLAUDE.md` 的 Project Overview 段落
- **THEN** 專案名稱 SHALL 顯示 `project_a`（啟動靈人系統），不含舊名稱 `BC-ERP`

### Requirement: 本機開發環境可一鍵啟動
執行 `make dev` 後，本機 Docker PostgreSQL 容器 SHALL 使用新命名正確啟動，`npm run dev` 亦可正常連線至資料庫。

#### Scenario: make dev 成功啟動 Docker 容器
- **WHEN** 開發者在本機執行 `make dev`
- **THEN** Docker 容器 SHALL 以 `project_a` 相關名稱啟動，PostgreSQL 資料庫名稱為 `project_a_db`

#### Scenario: .env.example 提供正確的 DB 名稱範例
- **WHEN** 開發者參照 `.env.example` 設定本機 `.env`
- **THEN** `DATABASE_URL_DEV` 範例值 SHALL 指向 `project_a_db`，不含舊名稱

### Requirement: 遠端部署腳本舊路徑標記
Makefile 中 `tunnel-deploy` 段落包含的 `bcerp` 硬編碼路徑 SHALL 以 `TODO` 註解標記，提醒開發者需在確認 VPS 實際路徑後手動更新，避免貿然修改破壞部署流程。

#### Scenario: tunnel-deploy 舊路徑有 TODO 標記
- **WHEN** 開發者讀取 Makefile 中的 tunnel-deploy 相關指令
- **THEN** 所有含 `bcerp` 的硬編碼路徑 SHALL 附有 `# TODO: 確認 VPS 實際路徑後更新` 註解
