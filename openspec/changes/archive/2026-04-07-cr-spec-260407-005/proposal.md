## Why

忘記密碼的後端邏輯已完整實作（`requestPasswordReset`、`resetPassword` actions、`PasswordResetToken` model、Email 寄送），但兩個前端頁面（`/forgot-password`、`/reset-password`）使用原生 HTML 元素，樣式與登入/註冊頁不一致，且登入頁缺少「忘記密碼？」入口連結。

## What Changes

- **`/forgot-password` 頁面改寫**：改用 shadcn/ui（`Input`、`Button`、`Label`），版面採用與登入/註冊頁相同的兩欄品牌版型（桌面左側品牌區 + 右側表單）
- **`/reset-password` 頁面改寫**：同上，改用 shadcn/ui 元件與一致版型
- **登入頁加入忘記密碼連結**：在 `user-auth-form.tsx` 的密碼輸入欄右側加入「忘記密碼？」連結，導向 `/forgot-password`

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `password-lifecycle`：忘記密碼流程補充 UI 實作說明（頁面樣式、登入入口）

## Impact

- `app/(auth)/forgot-password/page.tsx`：完整改寫
- `app/(auth)/reset-password/page.tsx`：完整改寫
- `app/(auth)/login/user-auth-form.tsx`：密碼欄旁新增「忘記密碼？」連結
