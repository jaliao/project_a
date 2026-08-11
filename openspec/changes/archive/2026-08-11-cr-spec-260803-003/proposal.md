## Why

需求單原文：「需要增加 Avatar 模組，用 shadcn（[avatar 元件](https://ui.shadcn.com/docs/components/base/avatar)），可以上傳自己的，沒有就用預設的」。

目前系統完全沒有使用者頭像功能：`User` model 只有 NextAuth 標準的 `image`（僅 Google 首次登入建帳時寫入一次，Email/密碼註冊者恆為 `null`），沒有任何上傳介面；剛完成的站內訊息功能（`cr-spec-260803-001`）裡的 `MessageAvatar` 目前也只是純 `IconUser` 圖示佔位符，design.md 當時已註明「先用預設圖示，不接真實頭像，日後再說」——這張 CR 正是要補上這塊。

經與提出人確認：
- 專案完全沒有既有的檔案上傳機制，`.env`／`.env.example` 已預留 Cloudflare R2（S3 相容物件儲存）設定框架與 `@aws-sdk/client-s3`／`@aws-sdk/s3-request-presigner` 依賴，但目前是註解狀態、程式碼從未實際使用過。確認採用 R2 存放頭像圖片，**新建一個 project_a 專屬的 bucket**（不與姊妹專案 bc-erp 共用）。
- R2 的實際帳號金鑰由提出人（Justin）自行至 Cloudflare 後台申請並填入 `.env`，本次 Spec／實作範圍**不包含**取得或設定真實金鑰，只負責讓程式碼讀取對應環境變數。

## What Changes

- **資料模型**：`User` 新增 `avatarKey String?`（R2 object key，例如 `avatars/{userId}/{uuid}.webp`；`null` 代表未上傳自訂頭像，需 fallback）。不覆用／不修改既有 `image` 欄位（保留給 NextAuth／Google OAuth 語意），避免未來 Google 帳號重新連結等情境意外覆寫使用者自訂頭像。
- **儲存**：新增 R2 物件儲存 helper（`lib/storage/r2.ts`），封裝上傳（`PutObjectCommand`）與刪除（`DeleteObjectCommand`）；Bucket 設定為公開讀取（Public Development URL 或自訂網域），圖片 URL 由 `avatarKey` + `R2_PUBLIC_URL` 環境變數即時組出，不做私有 bucket + 動態簽名（頭像本質是公開展示內容，不需要存取控制）。上傳走 Server Action 伺服器端直傳（表單送出檔案 → Server Action 收檔案 → 直接呼叫 R2 API），不做前端 presigned PUT 直傳、不需要額外設定 R2 CORS。
- **頭像顯示三層 fallback**：① 使用者自訂上傳（`avatarKey` 有值）→ ② Google OAuth 帶入的頭像（`User.image` 有值）→ ③ shadcn `AvatarFallback`（顯示姓名縮寫或預設圖示）。
- **上傳/更換/移除頭像**（個人資料頁）：新增 Server Actions `uploadAvatar`（驗證檔案類型 `image/jpeg`／`image/png`／`image/webp`、大小上限 2MB → 上傳至 R2 → 更新 `avatarKey` → 若有舊自訂頭像則刪除舊物件）與 `removeAvatar`（清空 `avatarKey`、刪除 R2 物件，恢復顯示 Google 頭像或預設圖示）。
- **顯示套用範圍**（本次聚焦這四處，避免一次改動面過大）：
  1. 個人資料頁（`/profile`、`/user/[spiritId]/profile`）：頭像管理 UI（預覽＋上傳／更換／移除）。
  2. 學員專屬頁面（`/user/{spiritId}`）：基本資料區塊顯示頭像（本人與他人皆可見的公開展示頁）。
  3. Topbar：以使用者頭像取代原本純 `IconUser` 圖示的「個人資料」按鈕。
  4. 站內訊息 `MessageAvatar`（`components/ui/message.tsx` 使用端）：接上真實頭像，取代目前的 `IconUser` 佔位符。
- **Session 整合**：比照既有 `isProfileComplete` 模式，於 `lib/auth.ts` 的 JWT/session callback 讀出 `avatarKey`／`image` 並組出 `session.user.avatarUrl`，避免每個頁面各自查詢。

## Capabilities

### New Capabilities
- `user-avatar`：使用者頭像上傳、儲存（R2）、顯示 fallback 邏輯，套用於個人資料頁／學員專屬頁面／Topbar／站內訊息

### Modified Capabilities
（無——`contact-member` 的 `MessageAvatar` 佔位符行為被取代，但該 capability 的既有需求文字未變更行為契約，僅底層顯示內容改變，不視為需求變更）

## Impact

- **Schema**：`prisma/schema/user.prisma` 新增 `avatarKey String?`；純新增欄位，無破壞性變更。
- **環境變數**：`.env.example` 新增 `R2_PUBLIC_URL`（頭像公開讀取網域，例如 `https://pub-xxxxxxxx.r2.dev` 或自訂網域），既有 `R2_ACCOUNT_ID`／`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`／`R2_BUCKET_NAME`／`R2_ENDPOINT` 沿用（提出人自行填入真實值，取消 `.env` 中的註解）。
- **新增**：`lib/storage/r2.ts`（S3Client 封裝：上傳／刪除）、`lib/utils/avatar.ts`（三層 fallback URL 組出邏輯）、`app/actions/avatar.ts`（`uploadAvatar`／`removeAvatar`，檔案類型/大小驗證直接寫在 action 內，未另立 Zod schema 檔案）、`components/ui/avatar.tsx`（`npx shadcn@latest add avatar`）、`components/shared/user-avatar.tsx`（共用顯示元件，三層 fallback）、`components/profile/avatar-upload-section.tsx`（個人資料頁頭像管理 UI，兩份 `profile-form.tsx` 共用）。
- **修改**：`prisma/schema/user.prisma`、`lib/auth.ts`（session 帶出 `avatarUrl`）、`components/layout/topbar.tsx`、`app/[locale]/(user)/user/[spiritId]/page.tsx`、兩份 `profile-form.tsx`、`components/ui/message.tsx` 使用端（`components/conversation/conversation-thread.tsx` 傳入真實頭像 URL）。
- **不修改**：`User.image`（NextAuth 標準欄位邏輯不變）、既有 R2 環境變數命名。
- **依賴**：`@aws-sdk/client-s3`／`@aws-sdk/s3-request-presigner` 已安裝，無需新增 npm 套件（`s3-request-presigner` 本次雖未使用，保留供未來私有物件情境擴充）。
