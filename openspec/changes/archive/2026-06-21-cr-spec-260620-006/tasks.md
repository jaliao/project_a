## 1. 測試學員帳號（seed.ts）

- [x] 1.1 在 `prisma/seed.ts` 測試講師區塊（約 line 150）之後，新增測試學員區塊，定義常數陣列（index 1~4）組出 email `student${i}@test.com`、spiritId `PA26900${i}`、nickname `測試學員${i}`
- [x] 1.2 以迴圈 `prisma.user.upsert`（where email）建立 4 位學員；`create` 設定：name/realName/nickname、gender、displayNameMode（`nickname_zh`）、spiritId、phone、`passwordHash: studentHash`、`roles: ['user']`、**`isTempPassword: false`**
- [x] 1.3 `update` 路徑僅同步 name/realName/nickname/spiritId/roles，**不覆寫** `passwordHash` 與 `isTempPassword`（維持冪等、不重置密碼）
- [x] 1.4 加入 `console.log` 提示「✅ 測試學員帳號（student1~4@test.com，已完成補填）初始化完成」

## 2. 測試講師補填狀態

- [x] 2.1 將既有 `teacher@test.com` 的 upsert `create.isTempPassword` 由 `true` 改為 `false`，並確認 `realName`/`phone` 已填（跳過 onboarding 與 profile guard）

## 3. spiritIdCounter 隔離

- [x] 3.1 確認 step 8 的 `spiritIdCounter` maxSeq 計算僅掃描名冊 `people`，不納入 `PA269xxx` 高位測試號段（避免計數器跳到 9999）；如有需要加註解說明

## 4. 驗證

- [x] 4.1 執行 `make prisma-seed`（或 `make clean && make dev && make schema-update && make prisma-seed`）確認 4 位學員 + 測試講師建立成功且無錯誤
- [x] 4.2 以 `student1@test.com` / `Student@1234` 登入，確認直接進入 `/dashboard`，未被導向 `/onboarding` 或 profile 補填頁
- [x] 4.3 再次執行 seed，確認冪等（無重複帳號、密碼與 isTempPassword 不被重置）
- [x] 4.4 於 Prisma Studio 或 `make db-shell` 抽查：4 位學員 spiritId 為 PA269001~PA269004、`isTempPassword=false`、`realName`/`phone` 非空

## 5. 收尾

- [x] 5.1 依 CLAUDE.md 第 9 點檢查 `doc/` 三份手冊是否需更新（本變更僅測試資料，無流程/按鈕/權限/路由異動 → 無需更新）
- [x] 5.2 apply 時將 `config/version.json` patch 版本號 +1（0.1.79 → 0.1.80）
