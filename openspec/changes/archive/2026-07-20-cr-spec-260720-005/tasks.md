# Tasks: cr-spec-260720-005 Makefile 正式環境命名統一為 prd

## 1. Makefile

- [x] 1.1 `PRISMA_GCP_DB` → `PRISMA_PRD_DB`（第 23 行），內容改引用 `DATABASE_URL_PRD`
- [x] 1.2 `.PHONY` 宣告：`tunnel-gcp tunnel-deploy-gcp prisma-gcp-status prisma-gcp-deploy prisma-gcp-seed` → `tunnel-prd tunnel-deploy-prd prisma-prd-status prisma-prd-deploy prisma-prd-seed prisma-prd-studio`
- [x] 1.3 區塊註解「Prisma 透過 tunnel deploy remote GCP」改為比照 kua-event 風格（含部署流程說明）
- [x] 1.4 `tunnel-gcp` → `tunnel-prd`（呼叫路徑 `pg-tunnel-gcp-activate.sh` 不變）
- [x] 1.5 `tunnel-deploy-gcp` → `tunnel-deploy-prd`（呼叫路徑 `project-a-tunnel-deploy-gcp.sh` 不變）
- [x] 1.6 `prisma-gcp-status` → `prisma-prd-status`；`prisma-gcp-deploy` → `prisma-prd-deploy`；`prisma-gcp-seed` → `prisma-prd-seed`（內部皆改用 `$(PRISMA_PRD_DB)`）
- [x] 1.7 新增 `prisma-prd-studio` 目標（比照 `prisma-vps3-studio`，`$(PRISMA_PRD_DB) npx prisma studio --browser none`）

## 2. 環境變數

- [x] 2.1 `.env`：`DATABASE_URL_GCP` → `DATABASE_URL_PRD`（值不變，`GCP_POSTGRES_*` 三個組成變數維持原名）
- [x] 2.2 `.env.example`：同步更名

## 3. 文件與版本

- [x] 3.1 巡檢 `CLAUDE.md` 確認無引用舊目標名稱（目前僅列 vps3，預期無需修改）
- [x] 3.2 `config/version.json` patch +1、`updatedAt` 更新

## 4. 驗證

- [x] 4.1 `make help` 確認新目標名稱正確顯示（若 help 區塊有列出 gcp 相關項目一併更新；巡檢後發現目前 help 未列 gcp 系列，預期無需修改）
- [x] 4.2 `grep -rn "GCP\|gcp" Makefile .env .env.example` 確認僅剩刻意保留的 `GCP_POSTGRES_*` 與腳本呼叫路徑（`pg-tunnel-gcp-activate.sh` 等）
