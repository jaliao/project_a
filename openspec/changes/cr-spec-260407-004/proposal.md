## Why

兩個密碼相關頁面需要完善：
1. `/change-password`（首次登入設定密碼）目前使用原生 HTML 元素，與其他認證頁風格不一致
2. Profile 頁面目前完全沒有「變更密碼」功能，一般會員無法在登入後主動修改密碼

## What Changes

- **`/change-password` 頁面改寫**：使用 shadcn/ui 元件 + 眼睛 icon 明碼切換，版面改為與登入頁一致的兩欄品牌版型，標題改為「第一次登入？請設定您的密碼」
- **Profile 頁面新增變更密碼區塊**：在 `/user/[spiritId]/profile` 頁面底部加入「變更密碼」Card，內含目前密碼、新密碼、確認新密碼欄位與眼睛 icon 切換，送出後顯示成功/失敗訊息
- **Server Action 新增 `changePassword`**：Profile 使用不同於 `changeTempPassword` 的 action（不修改 `isTempPassword` 欄位），Google OAuth 帳號（無 `passwordHash`）不顯示此區塊

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `password-lifecycle`：補充一般會員主動變更密碼的 UI 規格，及首次登入頁面樣式規範

## Impact

- `app/change-password/page.tsx`：完整改寫（shadcn/ui + 兩欄版型 + 眼睛 icon）
- `app/actions/auth.ts`：新增 `changePassword` action（一般變更，不觸碰 `isTempPassword`）
- `app/(user)/user/[spiritId]/profile/page.tsx`：傳入 `hasPassword` prop
- `app/(user)/user/[spiritId]/profile/profile-form.tsx`（或新元件）：新增變更密碼 Card
