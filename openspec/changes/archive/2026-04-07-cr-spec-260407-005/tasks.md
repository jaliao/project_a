## 1. 登入頁加入忘記密碼連結

- [x] 1.1 在 `app/(auth)/login/user-auth-form.tsx` 密碼欄的 label 區改為 `flex justify-between items-center`，右側加入 `<Link href="/forgot-password">` 顯示「忘記密碼？」

## 2. 改寫 `/forgot-password` 頁面

- [x] 2.1 將 `app/(auth)/forgot-password/page.tsx` 改為 Server Component（page metadata + 版型結構），抽出 `ForgotPasswordForm` Client Component 於同目錄
- [x] 2.2 頁面採用兩欄版型（參考 `login/page.tsx`）：左側品牌區引言「忘記密碼？輸入您的 Email，我們將發送重設連結。」，右側頂部有「返回登入」連結
- [x] 2.3 `ForgotPasswordForm` 改用 `Input`、`Button`、`Label`（shadcn/ui），送出按鈕文字「發送重設連結」
- [x] 2.4 送出成功後切換為 submitted 狀態，顯示提示文字與「返回登入」連結（維持現有邏輯，改用 shadcn/ui 樣式）

## 3. 改寫 `/reset-password` 頁面

- [x] 3.1 將 `app/(auth)/reset-password/page.tsx` 版型改為兩欄結構（參考 `login/page.tsx`），左側引言「設定您的新密碼，完成後即可重新登入。」，右側頂部有「返回登入」連結
- [x] 3.2 `ResetPasswordForm` 改用 `Input`、`Button`、`Label`（shadcn/ui）
- [x] 3.3 無 token 時的錯誤狀態改用 shadcn/ui 樣式呈現

## 4. 驗證

- [x] 4.1 執行 `npm run build` 確認無 TypeScript 編譯錯誤
