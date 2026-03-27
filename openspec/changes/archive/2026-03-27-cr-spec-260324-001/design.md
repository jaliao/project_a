## Context

系統使用 NextAuth 5（JWT strategy）+ bcryptjs 密碼雜湊。Credentials 登入需 `User` 記錄存在且 `passwordHash` 不為 null。目前無 `prisma/seed.ts`，`package.json` 未設定 seed 指令。`make prisma-seed` 指令已存在於 Makefile。

## Goals / Non-Goals

**Goals:**
- 提供冪等性初始化腳本，新部署時可安全重複執行
- 管理員 Email 固定為 `justin@blockcode.com.tw`
- 密碼透過 `SEED_ADMIN_PASSWORD` 環境變數設定（預設臨時密碼）
- 首次登入後強制變更密碼（`isTempPassword: true`）
- 執行後於 console 顯示帳號資訊（Email、臨時密碼提示）

**Non-Goals:**
- 不處理 WhitelistedEmail（不需要，此 Email 直接 upsert User）
- 不建立管理後台 UI
- 不處理多位管理員批次建立

## Decisions

### 1. 使用 `prisma/seed.ts` + tsx 執行
與現有工具鏈一致（tsx 已安裝）。`package.json` 加入 `"prisma": { "seed": "tsx prisma/seed.ts" }`。

### 2. Email 固定，密碼用環境變數
管理員 Email（`justin@blockcode.com.tw`）寫死於腳本，不透過環境變數。密碼使用 `SEED_ADMIN_PASSWORD`（預設 `Admin@1234`），使用 bcrypt hash 後存入。

### 3. upsert 確保冪等性
`prisma.user.upsert({ where: { email }, create: {...}, update: { role, name } })`
- update 區塊不覆蓋 `passwordHash`（避免管理員已改密碼後被 seed 重置）
- 僅更新 `role` 與 `name` 確保資料正確

### 4. role 設為 `superadmin`
系統最高權限，區別於一般 `admin`。

### 5. 執行後顯示帳號資訊
腳本結尾 `console.log` 輸出 Email 與密碼提示，方便部署後確認。

## Risks / Trade-offs

- **預設密碼外洩風險**：若忘記設定 `SEED_ADMIN_PASSWORD`，預設密碼 `Admin@1234` 會成為弱點 → `isTempPassword: true` 強制首次登入變更密碼降低風險
- **upsert update 不覆蓋密碼**：若需強制重置密碼，需手動刪除 User 再重新 seed

## Migration Plan

1. 新增 `prisma/seed.ts`
2. 更新 `package.json` 的 `prisma.seed` 設定
3. 更新 `.env.example` 加入 `SEED_ADMIN_PASSWORD` 說明
4. 執行 `make prisma-seed`

Rollback：從資料庫刪除 Email 為 `justin@blockcode.com.tw` 的 User 記錄即可。

## Open Questions

（無）
