## 1. package.json

- [x] 1.1 將 `name` 欄位從 `bc-erp` 更新為 `project_a`

## 2. Makefile

- [x] 2.1 將 `PROJECT_NAME` 變數更新為 `project_a`
- [x] 2.2 將 `help` 標題文字中的 `BC-ERP` 替換為 `啟動靈人系統 (project_a)`
- [x] 2.3 將 DB 名稱變數從 `bc-erp-db` 更新為 `project_a_db`
- [x] 2.4 在 `tunnel-deploy` 相關指令中的 `bcerp` 硬編碼路徑加上 `# TODO: 確認 VPS 實際路徑後更新` 註解

## 3. .env.example

- [x] 3.1 將 `DATABASE_URL_DEV` 範例值中的 DB 名稱更新為 `project_a_db`

## 4. CLAUDE.md

- [x] 4.1 將 Project Overview 段落中的 `BC-ERP` 替換為 `project_a`（啟動靈人系統）

## 5. 驗證

- [ ] 5.1 執行 `make dev` 確認 Docker 容器以新名稱正常啟動
- [ ] 5.2 執行 `npm run dev` 確認 Next.js dev server 可正常連線至資料庫
- [x] 5.3 執行 `make help` 確認輸出標題顯示新名稱
