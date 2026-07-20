# Proposal: cr-spec-260720-005 Makefile 正式環境命名統一為 prd（比照 kua-event）

## Why

project_a 的 Makefile 以 `gcp` 命名正式環境相關目標（`tunnel-gcp`、`prisma-gcp-*`、`PRISMA_GCP_DB`），而另一專案 kua-event 已改用 `prd` 命名（`tunnel-prd`、`prisma-prd-*`）。`gcp` 描述的是底層雲端供應商、`prd` 描述的是環境角色（正式環境），跨專案命名不一致增加切換專案時的認知負擔。統一以 `prd` 命名可與 kua-event 及未來專案的 Makefile 慣例一致。

## What Changes

- **Makefile 目標更名**（僅本 repo 內）：
  - `tunnel-gcp` → `tunnel-prd`
  - `tunnel-deploy-gcp` → `tunnel-deploy-prd`
  - `prisma-gcp-status` → `prisma-prd-status`
  - `prisma-gcp-deploy` → `prisma-prd-deploy`
  - `prisma-gcp-seed` → `prisma-prd-seed`
  - `PRISMA_GCP_DB` 變數 → `PRISMA_PRD_DB`
- **新增 `prisma-prd-studio`**：比照 kua-event，補上正式環境目前缺少的 Prisma Studio 連線目標。
- **環境變數更名**：`.env`、`.env.example` 的 `DATABASE_URL_GCP` → `DATABASE_URL_PRD`（`GCP_POSTGRES_USER`/`GCP_POSTGRES_PASSWORD`/`GCP_POSTGRES_DB` 是否同步更名於 design 階段決定）。
- **文件同步**：`CLAUDE.md` 部署相關段落（若有引用舊目標名稱）同步更新。
- **不變更**：`~/devops-toolkit/remote-admin/tunnel/` 下的實際腳本檔名與內容（`pg-tunnel-gcp-activate.sh`、`project-a-tunnel-deploy-gcp.sh`）——不在本 repo 版控範圍，Makefile 更名後的目標內容仍呼叫原檔名。
- **不變更**：`tunnel-vps3`／`prisma-vps3-*` 系列（VPS3 為獨立部署路徑，非本次「gcp→prd」更名對象）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

（無——本變更純屬專案建置工具（Makefile／環境變數）調整，不影響應用程式行為或使用者可見功能，不需 spec capability。）

## Impact

- **`Makefile`**：目標更名、新增 `prisma-prd-studio`、註解段落標題同步（「正式環境 project_a-prd」）
- **`.env`／`.env.example`**：`DATABASE_URL_GCP` → `DATABASE_URL_PRD`
- **`CLAUDE.md`**：若有引用 `prisma-gcp-*` 目標名稱需同步更新
- **`config/version.json`** patch +1（依專案慣例，即使本次非功能性變更）
- 無 migration、無資料庫變更、無應用程式碼變更
