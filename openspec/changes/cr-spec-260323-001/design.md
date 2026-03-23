## Context

專案從 `bc_erp` 遷移至 `project_a`（啟動靈人系統）後，設定檔中仍大量殘留舊名稱，包含 `bc-erp`、`bc_erp`、`BC-ERP` 等變體。這導致：

- Docker container / DB 名稱與新專案不符
- `make` 指令標題顯示舊名稱
- `package.json` name 欄位仍為舊名稱

此設計說明如何系統性地完成命名替換，並驗證 `make dev` 可一鍵啟動本機開發環境。

## Goals / Non-Goals

**Goals:**
- 替換所有設定檔中的 `bc-erp` / `bc_erp` / `BC-ERP` 為 `project_a` / `啟動靈人系統`
- 確保 `make dev` 可在本機正確啟動 Docker DB + Next.js dev server
- 清除或標記 `tunnel-deploy` 中的硬編碼舊路徑

**Non-Goals:**
- 不變更應用程式邏輯或功能
- 不修改 `.env` 實際內容（只更新 `.env.example`）
- 不重構 Makefile 結構或新增指令

## Decisions

### 決策 1：DB 名稱更新策略

**選擇**：將 `bc-erp-db` 更名為 `project_a_db`，同步更新 Makefile 與 `.env.example`。

**理由**：本地開發環境尚未有生產資料，直接重命名風險最低。若有現有 volume，`make clean && make dev` 可重建。

**替代方案**：保留 db 名稱不變 → 拒絕，因為這會讓新開發者困惑。

### 決策 2：CLAUDE.md 更新範圍

**選擇**：只更新 CLAUDE.md 中的專案名稱說明文字，不重寫整個文件。

**理由**：CLAUDE.md 結構已完善，只需修正 Project Overview 段落中的名稱參照。

### 決策 3：tunnel-deploy 路徑處理

**選擇**：以 `TODO` 註解標記硬編碼的 `bcerp` 路徑，不直接修改（因不確定 VPS 實際路徑）。

**理由**：遠端路徑需實際確認，貿然修改可能破壞部署流程。

## Risks / Trade-offs

- **[風險] 現有 Docker volume 使用舊 DB 名稱** → 緩解：文件說明需執行 `make clean` 清除舊 volume 再重建
- **[風險] `.env` 中 DATABASE_URL 仍指向舊 DB 名稱** → 緩解：tasks 中加入提醒，開發者需手動更新本機 `.env`
- **[風險] 遠端 VPS 部署指令依賴舊名稱** → 緩解：tunnel-deploy 段落加 TODO 標記，等待確認後再更新

## Migration Plan

1. 更新 `package.json` → `name: "project_a"`
2. 更新 `Makefile` → PROJECT_NAME、DB 名稱、help 標題、標記 tunnel-deploy TODO
3. 更新 `.env.example` → DB 名稱對應新命名
4. 更新 `CLAUDE.md` → Project Overview 段落名稱
5. 驗證：`make dev` 啟動成功，`npm run dev` 正常執行

**回滾策略**：所有變更均為設定檔文字替換，git revert 即可還原。

## Open Questions

- VPS3 上的實際資料庫名稱與路徑是否需要同步更新？（`tunnel-deploy` 段落待確認）
- `docker-compose.yml` 中的 image tag 是否也需更新為新名稱？
