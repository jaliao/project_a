## Why

目前 `middleware.ts` 使用 NextAuth Edge Runtime 模式（`auth.config.ts` 分拆），但 Edge JWT 不查 DB，導致 `isTempPassword` / `isProfileComplete` 讀到過期值，引發路由守衛邏輯錯誤（如 onboarding 無限跳轉）。統一改用 Node.js runtime，讓 middleware 不再依賴 NextAuth，避免 JWT 過期問題。

## What Changes

- 移除 `auth.config.ts`（Edge Runtime 分拆設定，不再需要）
- 改寫 `middleware.ts`：不引入 NextAuth，改為輕量判斷 session cookie 是否存在
- 更新 `lib/auth.ts`：移除 `...authConfig` spread，回歸單一完整設定
- 所有路由守衛（`isTempPassword`、`isProfileComplete`）保留在 RSC 層（`(user)/layout.tsx`），由完整版 `auth()` 負責，永遠讀 DB 最新值

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `password-lifecycle`：`isTempPassword` 攔截由 Edge middleware 移至 RSC layout，守衛行為不變，實作層改變

## Impact

- `auth.config.ts`：刪除
- `middleware.ts`：重寫，不再 import NextAuth
- `lib/auth.ts`：移除 `...authConfig` spread
- `app/(user)/layout.tsx`：已包含守衛邏輯（本次 cr-spec-260408-002 已完成），不需額外改動
- 不影響登入流程、JWT 結構、DB schema
