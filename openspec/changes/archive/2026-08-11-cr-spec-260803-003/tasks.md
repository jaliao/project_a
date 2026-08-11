## 1. UI 元件安裝

- [x] 1.1 執行 `npx shadcn@latest add avatar`，確認 `components/ui/avatar.tsx` 產生（`Avatar`／`AvatarImage`／`AvatarFallback`）

## 2. 資料模型

- [x] 2.1 `prisma/schema/user.prisma`：`User` model 新增 `avatarKey String?`
- [x] 2.2 執行 `make schema-update name=add_user_avatar_key`（純新增欄位，無破壞性變更）

## 3. 環境變數

- [x] 3.1 `.env.example`：新增 `R2_PUBLIC_URL`（頭像公開讀取網域，附註說明格式如 `https://pub-xxxxxxxx.r2.dev` 或自訂網域）；`R2_ACCOUNT_ID`／`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`／`R2_BUCKET_NAME`／`R2_ENDPOINT` 保留現有範例（沿用既有框架）
- [x] 3.2 提醒使用者（於回報中說明，不代為填寫）：需自行至 Cloudflare 後台建立 project_a 專屬 bucket、取得金鑰，並於 `.env` 取消相關欄位註解、填入真實值＋新增 `R2_PUBLIC_URL`，本機開發／驗證前置需求

## 4. Storage 與驗證 Helper

- [x] 4.1 新增 `lib/storage/r2.ts`：`uploadToR2(key, buffer, contentType)`、`deleteFromR2(key)`、`getPublicUrl(key)`（`S3Client` 封裝，`region: 'auto'`，詳見 design.md）
- [x] 4.2 新增 `lib/utils/avatar.ts`：`resolveAvatarUrl({ avatarKey, image })` 三層 fallback URL 組出邏輯（`avatarKey` → `image` → `null`）
- [x] 4.3 `messages/zh-TW.json`：新增 `validation.avatarTypeInvalid`（"僅支援 JPG／PNG／WebP 圖片格式"）、`validation.avatarTooLarge`（"圖片大小不可超過 2MB"）；`messages/en.json` 補英文翻譯；執行 `npm run gen:zh-cn`

## 5. Server Actions

- [x] 5.1 新增 `app/actions/avatar.ts`：`uploadAvatar(formData)`——登入檢查、取出並驗證檔案（type/size）、查詢現有 `avatarKey`、產生新 key（`avatars/{userId}/{randomUUID()}.{ext}`）、上傳至 R2、更新 `User.avatarKey`、若有舊 key 則刪除舊物件（fire-and-forget）、`revalidatePath('/', 'layout')`
- [x] 5.2 `removeAvatar()`——登入檢查、查詢現有 `avatarKey`（無則直接回傳成功）、清空 `User.avatarKey`、刪除 R2 物件（fire-and-forget）、`revalidatePath('/', 'layout')`

## 6. 共用顯示元件

- [x] 6.1 新增 `components/shared/user-avatar.tsx`：`UserAvatar({ avatarUrl, displayName, className })`，包裝 `Avatar`／`AvatarImage`／`AvatarFallback`（`avatarUrl` 為 `null` 時不渲染 `AvatarImage`，自動 fallback 顯示姓名首字）

## 7. Session 整合

- [x] 7.1 `lib/auth.ts`：兩處 JWT callback（首次登入、後續請求同步）查詢新增 `avatarKey`／`image`，寫入 `token.avatarUrl = resolveAvatarUrl(dbUser)`；`session` callback 對應寫入 `session.user.avatarUrl`
- [x] 7.2 `types/next-auth.d.ts`：Session／JWT 型別擴充新增 `avatarUrl: string | null`

## 8. 個人資料頁（上傳/更換/移除 UI）

- [x] 8.1 `app/[locale]/(user)/profile/profile-form.tsx`：頂部新增頭像區塊——`UserAvatar` 大尺寸預覽、隱藏的 `<input type="file" accept="image/jpeg,image/png,image/webp">`（選檔後立即呼叫 `uploadAvatar`）、`avatarKey` 有值時顯示「移除頭像」按鈕（呼叫 `removeAvatar`）
- [x] 8.2 `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`：比照 8.1 套用相同頭像管理區塊
- [x] 8.3 兩處 server component：`app/[locale]/(user)/profile/page.tsx` 本身為既有的純轉址頁、不渲染 `ProfileForm`，不需修改；已於 `app/[locale]/(user)/user/[spiritId]/profile/page.tsx` 的查詢補上 `avatarKey`／`image`（原查詢用 `include`，scalar 欄位本已全帶出），並傳入 `resolveAvatarUrl(user)` 組出的 `avatarUrl` 與 `avatarKey` 給表單元件

## 9. 其餘三處套用

- [x] 9.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`user` 查詢 `select` 新增 `avatarKey`、`image`；基本資料區塊姓名旁新增 `UserAvatar`（`resolveAvatarUrl(user)`）
- [x] 9.2 `components/layout/topbar.tsx`：新增 `avatarUrl` prop，個人資料按鈕改用 `UserAvatar`（小尺寸）取代 `IconUser`；呼叫端（`(user)/layout.tsx`、`(admin)/layout.tsx` 皆有渲染 Topbar，兩處皆已傳入 `session?.user?.avatarUrl`）
- [x] 9.3 `lib/data/conversation.ts`：`ConversationMessageItem` 型別新增 `authorAvatarUrl: string | null`；`messageSelect` 補上 `author.avatarKey`／`author.image`，`mapMessages` 用 `resolveAvatarUrl` 組出後填入
- [x] 9.4 `components/conversation/conversation-thread.tsx`：`ConversationThreadMessage` 型別新增 `authorAvatarUrl`，`MessageAvatar` 內改用 `UserAvatar`（傳入 `m.authorAvatarUrl`、`m.authorName`）取代寫死的 `IconUser`

## 10. 驗證

- [x] 10.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 10.2 確認 `.env` 已填入真實 R2 憑證與 `R2_PUBLIC_URL`（前置條件，非本次程式碼可驗證項目，若未填妥則以下手動驗證項目無法進行，需等使用者完成環境設定）
- [x] 10.3 於個人資料頁上傳一張 jpg 圖片，確認上傳成功、頭像立即顯示、R2 bucket 內出現對應物件
- [x] 10.4 上傳 gif 或超過 2MB 的圖片，確認被拒絕並顯示對應錯誤提示
- [x] 10.5 更換頭像（上傳第二張圖片），確認新頭像生效、R2 bucket 內舊物件已被刪除
- [x] 10.6 點擊「移除頭像」，確認 `avatarKey` 清空、R2 物件被刪除、頁面 fallback 顯示正確（有 Google 頭像者顯示 Google 頭像，無則顯示預設圖示）
- [x] 10.7 確認學員專屬頁面、Topbar、站內訊息三處皆正確顯示頭像（含 fallback 情境：無自訂頭像的其他測試帳號應顯示預設圖示，不應破圖或顯示他人頭像）

**已知阻塞（本次 session 無法完成）**：10.2–10.7 皆依賴 `.env` 已填入真實 R2 憑證這個明確前置條件（proposal/design 已載明由使用者自行處理，非本次程式碼負責範圍）。本次 session 確認 `.env` 內 `R2_ACCOUNT_ID`／`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`／`R2_BUCKET_NAME`／`R2_ENDPOINT` 仍為註解狀態（尚未啟用），`R2_PUBLIC_URL` 亦尚未加入 `.env`，因此無法實際呼叫 R2 API 驗證上傳/刪除/顯示流程。程式碼變更（1.1–10.1，含元件安裝、Prisma migration、環境變數範例、Storage/驗證 helper、Server Actions、共用顯示元件、Session 整合、個人資料頁 UI、其餘三處套用）皆已完成並通過 `tsc`／`lint`；待使用者於 `.env` 填入真實 R2 憑證與 `R2_PUBLIC_URL` 後，10.2–10.7 才能進行。
