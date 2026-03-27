## 1. Seed 腳本

- [x] 1.1 建立 `prisma/seed.ts`，import prisma client 與 bcryptjs
- [x] 1.2 從 `process.env.SEED_ADMIN_PASSWORD` 讀取密碼，無設定則預設 `Admin@1234`
- [x] 1.3 使用 bcrypt hash 密碼（saltRounds: 12）
- [x] 1.4 使用 `prisma.user.upsert` 建立/更新管理員（email: `justin@blockcode.com.tw`、role: superadmin、isTempPassword: true、name: 系統管理員）
- [x] 1.5 upsert 的 update 區塊僅更新 role 與 name，不覆蓋 passwordHash
- [x] 1.6 執行成功後 console.log 顯示 Email 與密碼來源說明（環境變數或預設值）

## 2. package.json 設定

- [x] 2.1 在 `package.json` 的 `"prisma"` 欄位加入 `"seed": "tsx prisma/seed.ts"`

## 3. 環境變數說明

- [x] 3.1 在 `.env.example` 新增 `SEED_ADMIN_PASSWORD` 說明（附預設值備註）

## 4. 版本與文件更新

- [x] 4.1 將 `config/version.json` patch 版本號 +1
- [x] 4.2 依 `.ai-rules.md` 規範更新 `README-AI.md`
