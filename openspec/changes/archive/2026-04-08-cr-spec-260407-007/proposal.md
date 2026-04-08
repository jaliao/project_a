## Why

新會員以臨時密碼首次登入時，體驗是拼湊的：強制換密碼後跳到 Profile 頁，不知道還有幾步、不清楚為何被攔截。需要一個完整的 Onboarding Wizard，引導新會員一次完成「設定密碼 → 填寫基本資料 → 歡迎畫面」三步驟，降低摩擦並提高完成率。

## What Changes

- 新增 `/onboarding` 路由，含三步驟 Wizard（全版版型，無側邊欄）
  - Step 1：設定密碼（複用 `changeTempPassword` action）
  - Step 2：填寫基本資料（`realName`、`phone`，其餘可後填）
  - Step 3：歡迎畫面（顯示靈人編號，引導進入系統）
- 修改 middleware：`isTempPassword=true` 改導向 `/onboarding`（原為 `/change-password`）
- `cr-spec-260407-006` 的 profile completion guard 排除 `/onboarding` 路徑

## Capabilities

### New Capabilities

- `onboarding-wizard`: 三步驟首次登入引導流程

### Modified Capabilities

- `password-lifecycle`: middleware 攔截目標由 `/change-password` 改為 `/onboarding`
- `profile-completion-guard`: layout guard 排除 `/onboarding` 路徑

## Impact

- `app/middleware.ts`：修改 `isTempPassword` 攔截目標
- `app/(user)/layout.tsx`：guard 排除 `/onboarding`
- 新增 `app/onboarding/page.tsx`、`app/onboarding/onboarding-wizard.tsx`
- 現有 `/change-password` 頁保留不動（供已登入用戶在 Profile 頁變更密碼使用）
