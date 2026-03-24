## 1. 修改 seed.ts

- [x] 1.1 新增學員密碼常數與環境變數支援（`SEED_STUDENT_PASSWORD`）
- [x] 1.2 定義 4 位學員資料陣列（email、realName、nickname、spiritId、phone）
- [x] 1.3 使用 `Promise.all` + `upsert` 批次建立學員帳號
- [x] 1.4 在 console 輸出學員帳號建立結果摘要

## 2. 驗證

- [x] 2.1 執行 `make prisma-seed` 確認 4 筆學員帳號成功建立
- [x] 2.2 重複執行 `make prisma-seed` 確認冪等（帳號不重複）
- [x] 2.3 更新 `config/version.json` patch +1
- [x] 2.4 更新 `README-AI.md`
