## 1. auth.ts 修正

- [x] 1.1 在 `lib/auth.ts` 的 Google provider 加上 `allowDangerousEmailAccountLinking: true`

## 2. 註冊頁重構

- [x] 2.1 將 `app/(auth)/register/page.tsx` 重構為 shadcn 兩欄版型（參考 `app/(auth)/login/page.tsx` 結構）
- [x] 2.2 抽出 `RegisterForm` Client Component（含 Email 表單 + Google OAuth 按鈕），Google 按鈕點擊後呼叫 `signIn('google', { callbackUrl: '/dashboard' })`

## 3. Profile 帳號連動啟用

- [x] 3.1 在 `app/(user)/profile/profile-form.tsx` 新增 `handleLinkGoogle`，呼叫 `signIn('google', { callbackUrl: '/profile' })`
- [x] 3.2 將 Profile 頁「連結帳號」按鈕從 `disabled` 改為可點擊，綁定 `handleLinkGoogle`
- [x] 3.3 移除 `app/actions/profile.ts` 的 `linkGoogleAccount()` stub（已無需要）

## 4. 版本與文件更新

- [x] 4.1 將 `config/version.json` patch 版本號 +1
- [x] 4.2 更新 `README-AI.md` 版本號
