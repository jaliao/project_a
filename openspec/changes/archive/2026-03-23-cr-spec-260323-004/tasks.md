## 1. 資料庫 Schema 建立

- [x] 1.1 建立 `prisma/schema/base.prisma`（generator + datasource）
- [x] 1.2 建立 `prisma/schema/user.prisma`，新增欄位：`spiritId`、`passwordHash`、`isTempPassword`、`commEmail`、`isCommVerified`、`realName`、`phone`、`isPhoneVerified`、`address`、`lineId`
- [x] 1.3 建立 `SpiritIdCounter` 模型（`year: Int`, `seq: Int`, 複合 unique）
- [x] 1.4 建立 `PasswordResetToken` 模型（`token`、`email`、`expiresAt`、`usedAt`）
- [x] 1.5 執行 `make schema-update name=member-system-init` 產生 migration

## 2. Spirit ID 核發機制

- [x] 2.1 建立 `lib/spirit-id.ts`：實作 `generateSpiritId()` 函式（`prisma.$transaction` + `upsert` 原子遞增）
- [x] 2.2 驗證跨年流水號重置邏輯（year 不同時 seq 從 1 開始）

## 3. 認證層設定（NextAuth）

- [x] 3.1 建立 `lib/auth.ts`，加入 Google OAuth provider（保留現有設計）
- [x] 3.2 加入 Credentials provider（Email + 密碼登入，bcrypt 驗證）
- [x] 3.3 在 `signIn` callback 實作 Google 首次登入自動建帳並核發 Spirit ID
- [x] 3.4 在 JWT callback 寫入 `isTempPassword`、`spiritId`、`role` 至 token
- [x] 3.5 建立 `app/api/auth/[...nextauth]/route.ts` handler

## 4. Middleware 攔截

- [x] 4.1 建立 `app/middleware.ts`，加入公開路由白名單（`/login`、`/register`、`/forgot-password`、`/reset-password`、`/change-password`）
- [x] 4.2 實作 `isTempPassword` 攔截：已登入且 token 中 `isTempPassword = true` 時強制導向 `/change-password`

## 5. Email 服務

- [x] 5.1 安裝並設定 Nodemailer（`npm install nodemailer --legacy-peer-deps`）
- [x] 5.2 建立 `lib/mailer.ts`：封裝 SMTP 寄信函式
- [x] 5.3 建立寄信模板：臨時密碼通知信
- [x] 5.4 建立寄信模板：通訊 Email 驗證信
- [x] 5.5 建立寄信模板：密碼重設連結信
- [x] 5.6 補充 `.env.example`：加入 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`

## 6. Server Actions

- [x] 6.1 建立 `app/actions/auth.ts`：`registerWithEmail()`（建帳、核發 Spirit ID、寄臨時密碼）
- [x] 6.2 建立 `app/actions/auth.ts`：`changeTempPassword()`（驗證新舊密碼差異、更新 hash、`isTempPassword = false`）
- [x] 6.3 建立 `app/actions/auth.ts`：`requestPasswordReset()`（生成 token、寄重設信）
- [x] 6.4 建立 `app/actions/auth.ts`：`resetPassword()`（驗證 token 有效性、更新密碼、token 標記已使用）
- [x] 6.5 建立 `app/actions/profile.ts`：`updateProfile()`（真實姓名、手機、地址）
- [x] 6.6 建立 `app/actions/profile.ts`：`updateCommEmail()`（更新 `commEmail`、重置 `isCommVerified`、發驗證信）
- [x] 6.7 建立 `app/actions/profile.ts`：`verifyCommEmail()`（驗證 token、更新 `isCommVerified = true`）
- [x] 6.8 建立 `app/actions/profile.ts`：`resendCommVerification()`（重發驗證信）
- [x] 6.9 建立 `app/actions/profile.ts`：`linkGoogleAccount()`、`unlinkGoogleAccount()`（含唯一登入方式防護）

## 7. 資料存取層

- [x] 7.1 建立 `lib/data/user.ts`：`getUserByEmail()`、`getUserById()`
- [x] 7.2 建立 `lib/data/password-reset.ts`：`getValidResetToken()`、`markTokenUsed()`

## 8. 路由頁面

- [x] 8.1 建立 `app/(auth)/register/page.tsx`（Email 註冊表單）
- [x] 8.2 建立 `app/(auth)/login/page.tsx`（Email/密碼登入 + Google 登入按鈕）
- [x] 8.3 建立 `app/(auth)/forgot-password/page.tsx`（輸入 Email 申請重設）
- [x] 8.4 建立 `app/(auth)/reset-password/page.tsx`（含 token 驗證的新密碼設定）
- [x] 8.5 建立 `app/change-password/page.tsx`（臨時密碼強制變更，不含 sidebar layout）
- [x] 8.6 建立 `app/(user)/profile/page.tsx`（個人資料 + 帳號連動 + 通訊 Email）

## 9. Zod Schema

- [x] 9.1 建立 `lib/schemas/auth.ts`：`registerSchema`、`loginSchema`、`changePasswordSchema`、`resetPasswordSchema`
- [x] 9.2 建立 `lib/schemas/profile.ts`：`updateProfileSchema`、`commEmailSchema`

## 10. 版本與文件

- [x] 10.1 將 `config/version.json` patch 版本號 +1
- [x] 10.2 依 `.ai-rules.md` 規範更新 `README-AI.md`（`.ai-rules.md` 尚未建立，略過）
- [x] 10.3 執行 `npm run build` 確認生產建置無錯誤

## 11. 後續修正（實測發現）

- [x] 11.1 Makefile `prisma-dev-status` / `prisma-dev-deploy` 改為在容器內執行（DB port 未外露）
- [x] 11.2 登入頁改為 Mobile First 版型（shadcn Authentication 範例，手機顯示表單，桌面顯示左側品牌欄）
- [x] 11.3 CSS variables 從 oklch 改為 HSL triplet 格式，`@theme inline` 透過 `hsl(var(--xxx))` 橋接 Tailwind v4
- [x] 11.4 新增 `SMTP_FROM` 環境變數，修正 Brevo 寄件者驗證問題（`FROM` 不可使用 SMTP_USER）
