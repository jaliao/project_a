## Why

目前有兩個 Google 帳號相關功能尚未完整：
1. `/register` 頁面缺少 Google OAuth 入口，UI 也未與 `/login` 統一
2. Profile 頁「連結帳號」按鈕是 disabled stub，使用者無法實際綁定 Google 帳號

本次補全這兩個入口，讓 Google 帳號在整個系統（註冊、登入、帳號連動）中都能完整使用。

## What Changes

- `/register` 頁面新增「以 Google 帳號繼續」按鈕，UI 升級為與 `/login` 相同的 shadcn 兩欄版型
- Profile 頁「連結帳號」按鈕啟用：點擊後觸發 Google OAuth，OAuth 回呼時將 Google provider 關聯至當前帳號
- `linkGoogleAccount()` server action 實作實際綁定邏輯（目前為 stub）
- `auth.ts` signIn callback 新增：若 Google OAuth 完成後對應 email 已有帳號且尚未連結 Google，自動執行帳號連動

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `email-registration`：`/register` 頁面新增 Google OAuth 入口，統一為 shadcn 版型
- `account-linking`：Google 帳號連動從 disabled stub 升級為可運作功能

## Impact

- `app/(auth)/register/page.tsx`：重構 UI，新增 Google OAuth 按鈕
- `app/(user)/profile/profile-form.tsx`：啟用「連結帳號」按鈕
- `app/actions/profile.ts`：`linkGoogleAccount()` 實作綁定邏輯
- `lib/auth.ts`：signIn callback 補上帳號連動判斷
