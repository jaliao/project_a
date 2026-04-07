## 1. 新增 `changePassword` Server Action

- [x] 1.1 在 `app/actions/auth.ts` 新增 `changePassword(formData)` action：驗證 session、驗證目前密碼、更新 `passwordHash`（不修改 `isTempPassword`）

## 2. 改寫 `/change-password` 頁面

- [x] 2.1 將 `app/change-password/page.tsx` 改為 Server Component + 兩欄品牌版型（參考 `/forgot-password/page.tsx`）
- [x] 2.2 抽出 `ChangePasswordForm` Client Component（`change-password-form.tsx`），使用 shadcn/ui `Input`、`Button`、`Label`
- [x] 2.3 三個密碼欄各加眼睛 icon 明碼切換（獨立 state）
- [x] 2.4 標題改為「第一次登入？請設定您的密碼」

## 3. Profile 頁新增變更密碼 Card

- [x] 3.1 建立 `app/(user)/user/[spiritId]/profile/change-password-card.tsx` Client Component：三欄密碼 + 眼睛 icon + 送出呼叫 `changePassword` action
- [x] 3.2 在 `profile/page.tsx` 查詢 `user.passwordHash !== null`，傳入 `hasPassword`，在 `SignOutSection` 之前掛載 `ChangePasswordCard`

## 4. 驗證

- [x] 4.1 執行 `npm run build` 確認無 TypeScript 編譯錯誤
