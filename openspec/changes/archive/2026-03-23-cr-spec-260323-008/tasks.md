## 1. 資料庫模型

- [x] 1.1 在 `prisma/schema/user.prisma` 的 `User` 模型新增 `nickname String?` 欄位
- [x] 1.2 執行 `make schema-update name=add_nickname` 產生 migration 並更新 Prisma client

## 2. Zod Schema 與 Server Action

- [x] 2.1 在 `lib/schemas/profile.ts` 的 `updateProfileSchema` 新增 `nickname: z.string().max(20).optional()`
- [x] 2.2 在 `app/actions/profile.ts` 的 `updateProfile` 新增從 FormData 讀取並儲存 `nickname`

## 3. Dashboard 資料完整度 Banner

- [x] 3.1 在 `app/(user)/dashboard/page.tsx` 查詢當前登入使用者的 `realName`、`commEmail`、`phone`，計算 `isComplete` 與 `displayName`（commEmail 以 `commEmail ?? email` 作 fallback）
- [x] 3.2 新增 `components/dashboard/profile-banner.tsx`（Client Component）：`isComplete` 為 false 時顯示提醒 Banner（含連結至 `/profile`），為 true 時顯示「歡迎回來，{displayName}！」
- [x] 3.3 在 `DashboardPage` 的 JSX 頂部（標題列上方）引入並渲染 `<ProfileBanner>`

## 4. Profile 表單暱稱欄位

- [x] 4.1 在 `app/(user)/profile/profile-form.tsx` 的基本資料表單新增暱稱（nickname）Input 欄位，含 defaultValue 與 register 綁定
- [x] 4.2 在 `onProfileSubmit` 的 FormData 新增 `fd.set('nickname', data.nickname ?? '')`

## 5. Profile 頁面登出按鈕

- [x] 5.1 新增 `components/profile/sign-out-section.tsx`（Client Component）：含「登出」Button（variant=`outline`，呼叫 `signOut({ callbackUrl: '/login' })`）
- [x] 5.2 在 `app/(user)/profile/page.tsx` 引入 `<SignOutSection>`，置於頁面最底部，加上視覺分隔（`Separator` 或 border）
- [x] 5.3 Profile 表單通訊 Email 預設值改為 `commEmail ?? email`（新用戶自動帶入登入 email）

## 6. 版本與文件

- [x] 6.1 更新 `config/version.json` patch 版本號 +1
- [x] 6.2 更新 `README-AI.md`（新增 nickname 欄位說明、ProfileBanner 元件、SignOutSection 元件，更新任務狀態）
