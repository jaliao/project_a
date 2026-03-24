## ADDED Requirements

### Requirement: 建立系統管理員帳號
`prisma/seed.ts` 腳本 SHALL 使用 upsert 建立 Email 為 `justin@blockcode.com.tw`、role 為 `superadmin` 的 User 記錄，並填入 spiritId（PA000001）、realName（系統管理員）、nickname（管理員）。

#### Scenario: 全新資料庫執行 seed
- **WHEN** 資料庫中無 `justin@blockcode.com.tw` 的 User 記錄
- **THEN** 腳本建立新 User（email、passwordHash、role=superadmin、isTempPassword=true、name/realName=系統管理員、nickname=管理員、spiritId=PA000001）

#### Scenario: 重複執行 seed（冪等性）
- **WHEN** `justin@blockcode.com.tw` 的 User 記錄已存在
- **THEN** 腳本 upsert 更新 role、name、realName、nickname、spiritId，不覆蓋 passwordHash

### Requirement: 密碼透過環境變數設定
腳本 SHALL 從 `SEED_ADMIN_PASSWORD` 環境變數讀取密碼，若未設定則使用預設值 `Admin@1234`，並以 bcrypt 雜湊後存入 `passwordHash`。

#### Scenario: 有設定 SEED_ADMIN_PASSWORD
- **WHEN** 環境變數 `SEED_ADMIN_PASSWORD` 有值
- **THEN** 使用該值作為管理員密碼（bcrypt hash）

#### Scenario: 未設定 SEED_ADMIN_PASSWORD
- **WHEN** 環境變數 `SEED_ADMIN_PASSWORD` 未設定
- **THEN** 使用預設值 `Admin@1234` 作為臨時密碼（bcrypt hash）

### Requirement: 首次登入強制變更密碼
建立的管理員帳號 SHALL 將 `isTempPassword` 設為 `true`，觸發系統的臨時密碼強制變更流程。

#### Scenario: 管理員首次登入
- **WHEN** 管理員使用 seed 產生的密碼登入
- **THEN** 系統偵測 `isTempPassword=true`，導向 `/change-password` 強制變更密碼

### Requirement: 執行後顯示帳號資訊
腳本 SHALL 在成功執行後於 console 輸出管理員帳號資訊，包含 Email 與密碼來源說明。

#### Scenario: seed 執行成功
- **WHEN** upsert 完成且無錯誤
- **THEN** console 輸出 Email（`justin@blockcode.com.tw`）與提示訊息（說明密碼來源與首次登入須變更密碼）

### Requirement: Makefile 提供兩種執行方式
系統 SHALL 透過 Makefile 支援兩種 seed 執行方式。

#### Scenario: make prisma-seed（本機直連）
- **WHEN** 執行 `make prisma-seed`
- **THEN** 透過 `PRISMA_DEV_DB` 設定 DATABASE_URL 後直接執行 `npx tsx prisma/seed.ts`

#### Scenario: make prisma-dev-seed（Docker 容器內）
- **WHEN** 執行 `make prisma-dev-seed`
- **THEN** 透過 `docker compose exec web npx tsx prisma/seed.ts` 在 dev 容器內執行 seed
