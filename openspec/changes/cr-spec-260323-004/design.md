## Context

啟動靈人系統為全新 Next.js 16 專案（App Router），目前尚未建立任何 `app/`、`lib/`、`prisma/` 目錄。本次會員模組為系統第一個核心功能，需從零建立認證層、資料層與 UI 路由。

技術棧：Next.js 16.1.1 + React 19 + TypeScript 5、Prisma 7（多檔案 schema）、NextAuth 5.0 beta、PostgreSQL、Tailwind CSS 4 + shadcn/ui。

## Goals / Non-Goals

**Goals:**
- 建立 Spirit ID 流水號核發機制（全系統唯一）
- 實作 Email 自主註冊 + 臨時密碼強制變更流程
- 實作 Google OAuth 登入（保留現有設計）
- 管理通訊 Email 獨立於登入帳號（含驗證狀態）
- 提供 User Profile 頁面供資料補填與帳號連動
- 忘記密碼 / 密碼重設流程

**Non-Goals:**
- LINE OAuth（本次不實作，保留擴充架構）
- 手機 OTP 驗證（手機號碼本次僅儲存，不發 SMS）
- 後台管理介面（會員管理由 superadmin 直接操作 DB 或另立 CR）
- Email 服務商整合（本次使用 Nodemailer + SMTP，不綁定特定供應商）

## Decisions

### 1. NextAuth Credentials Provider 處理 Email 登入

**決定：** 使用 NextAuth 5 Credentials provider，不自建 JWT 登入路由。

**理由：** 與現有 Google OAuth provider 共用 session/JWT 管線，避免維護兩套 auth 狀態。NextAuth 5 的 `signIn("credentials", ...)` 可無縫整合。

**替代方案：** 自建 `/api/auth/login` REST endpoint — 放棄，因需額外管理 session 同步與 CSRF。

---

### 2. Spirit ID 使用獨立計數表（非 UUID）

**決定：** 新增 `SpiritIdCounter` 表（`year: Int`, `seq: Int`），透過 `prisma.$transaction` + `upsert` 確保原子性遞增。格式：`PA + YY + seq.toString().padStart(4, '0')`。

**理由：** 與現有 `ProjectCounter` 模式一致，可讀性高且符合規格書要求。UUID 無法滿足「PA260001」格式需求。

**替代方案：** PostgreSQL SEQUENCE — 可行，但需原生 SQL migration，增加 Prisma 多檔 schema 複雜度。

---

### 3. 密碼使用 bcrypt hash，臨時密碼標記獨立欄位

**決定：** `User` 新增 `passwordHash: String?`、`isTempPassword: Boolean @default(false)`。臨時密碼格式：`[A-Za-z0-9]{12}` 隨機生成（`crypto.randomBytes`）。

**理由：** `isTempPassword` 欄位讓 middleware 可直接攔截，不需解析密碼內容。`String?` 允許 Google-only 用戶不設密碼。

---

### 4. 通訊 Email 與登入帳號分離

**決定：** `User` 新增 `commEmail: String?`、`isCommVerified: Boolean @default(false)`。登入用的 `email` 欄位保持唯一且不可修改。

**理由：** 符合規格書要求，允許用戶使用不同信箱接收課程通知，且驗證狀態可獨立追蹤。

---

### 5. 密碼重設使用 signed token（非臨時密碼寄送）

**決定：** 使用 `crypto.randomUUID()` 生成 token，存入新增的 `PasswordResetToken` 表（含 `expiresAt`，TTL 1 小時）。使用者點擊連結後驗證 token 有效性再允許設定新密碼。

**理由：** 比直接寄送新臨時密碼更安全，token 一次性使用且有效期限制，可防暴力破解。

---

### 6. 登入頁面版型

**決定：** 採用 shadcn/ui Authentication 範例版型（左側品牌欄 + 右側表單），Mobile First — 手機版僅顯示表單，桌面（lg+）才顯示左側品牌欄。

**CSS 變數格式：** 使用 HSL triplet 格式（`--primary: 221.2 83.2% 53.3%`），透過 `@theme inline` 中的 `hsl(var(--xxx))` 橋接 Tailwind v4。主色調為藍色系。

**理由：** 符合 mobile-first 設計優先原則；HSL triplet 格式與 shadcn/ui 元件庫預設主題一致，方便後續擴充色票。

---

### 7. Middleware 攔截 `isTempPassword`

**決定：** `middleware.ts` 讀取 JWT session 中的 `isTempPassword` 欄位，若為 `true` 且當前路徑不在白名單（`/change-password`, `/api/auth/*`），強制 redirect 至 `/change-password`。

**理由：** 攔截層在 middleware 處理，避免每個 Server Component 重複判斷。JWT callback 在登入時將 `isTempPassword` 寫入 token。

## Risks / Trade-offs

- **NextAuth 5 beta 不穩定** → 鎖定目前已安裝版本，不自動升級；遇 breaking change 查官方 migration guide
- **Email 寄送失敗導致用戶無法取得臨時密碼** → 提供 resend 機制（Profile 頁面「重發驗證信」按鈕）；superadmin 可查看 DB 直接取得
- **Brevo SMTP 寄件者驗證（已修正）：** `FROM` 地址不可使用 SMTP 帳號（`SMTP_USER`），必須是 Brevo 後台驗證過的寄件者。新增 `SMTP_FROM` 環境變數，`mailer.ts` 優先使用 `SMTP_FROM`，fallback 至 `SMTP_USER`。部署前須至 Brevo → Senders & IPs 完成寄件者驗證並設定 `SMTP_FROM`。
- **Spirit ID 並發衝突（高並發同年同時註冊）** → `prisma.$transaction` 搭配 `upsert` 在 PostgreSQL 序列化隔離層處理，風險低（非高頻場景）
- **`isTempPassword` 中介層繞過（直接呼叫 API）** → Server Actions 內再次驗證 session 中的 `isTempPassword`，雙重防護

## Migration Plan

1. 建立 Prisma multi-file schema（`user.prisma`、`base.prisma`）
2. 執行 `make schema-update name=member-system-init`
3. 部署 Next.js app（`npm run build`）
4. 以 superadmin 身分在 DB 新增第一筆 `WhitelistedEmail`（或透過 seed）
5. 測試 Email 註冊 → 臨時密碼流程 → 強制變更 → Profile 填寫

**⚠️ 注意（已修正）：** `docker-compose.dev.yml` 未外露 DB port（移除 `5432:5432`），導致 `PRISMA_DEV_DB`（`127.0.0.1:5432`）無法從 host 連線。Makefile 的 `prisma-dev-status` 與 `prisma-dev-deploy` 已改為透過 `$(DEV_COMPOSE) exec web npx prisma ...` 在容器內執行，確保 migration 正確套用。

**Rollback：** migration down 回上一版（本次為初始建置，無前版 schema 需回復）

## Open Questions

- Email SMTP 設定：使用 Gmail SMTP / Resend / SendGrid？（需確認後補入 `.env.example`，目前預設 Gmail SMTP）
- LINE OAuth：本次 Non-Goal，`User.lineId` 欄位已預先保留，Provider 設定待後續 CR
- 手機驗證：本次僅儲存，`isPhoneVerified` 欄位已保留，待後續 CR 接 SMS 服務
