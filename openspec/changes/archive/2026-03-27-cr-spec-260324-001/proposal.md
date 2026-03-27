## Why

系統目前無初始管理員資料，全新部署後無法登入後台管理介面。需要一個初始化機制，讓第一位系統管理員能透過指令建立帳號並登入系統。

## What Changes

- 新增 `prisma/seed.ts` 初始化腳本，建立指定管理員帳號（Email 固定為 `justin@blockcode.com.tw`）
- 管理員 role 設為 `superadmin`，`isTempPassword` 設為 `true`（首次登入強制變更密碼）
- 密碼透過環境變數 `SEED_ADMIN_PASSWORD` 設定（預設臨時密碼）
- 腳本執行完成後自動於 console 顯示管理員帳號資訊
- 整合至 Makefile：`make prisma-seed` 執行初始化
- 腳本具有冪等性（idempotent）：重複執行使用 `upsert`，不建立重複資料

## Capabilities

### New Capabilities
- `admin-seed`: 系統管理員帳號初始化腳本（prisma/seed.ts），含 upsert 邏輯、固定 Email、執行後顯示帳號資訊

### Modified Capabilities
（無現有 spec 需異動）

## Impact

- `prisma/seed.ts` — 新增初始化腳本（upsert User，Email 固定為 justin@blockcode.com.tw）
- `package.json` — 新增 `prisma.seed` 設定（`tsx prisma/seed.ts`）
- `.env.example` — 新增 `SEED_ADMIN_PASSWORD` 說明
- 不需 DB schema 變更
