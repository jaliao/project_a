## Context

- `changeTempPassword` action 已實作驗證目前密碼並更新，但名稱語義針對臨時密碼，且會將 `isTempPassword` 設為 `false`
- Profile 頁已有 `linkedProviders` 資料，可判斷是否為純 Google OAuth 帳號（無密碼）
- `/change-password` 是獨立全版面，不在 `(user)/` sidebar layout 內

## Goals / Non-Goals

**Goals:**
- `/change-password` 改用 shadcn/ui + 兩欄版型 + 三個密碼欄的眼睛 icon
- Profile 新增「變更密碼」Card（僅 Email 帳號顯示）
- 新增 `changePassword` action，不改動 `isTempPassword`

**Non-Goals:**
- 不改動 `changeTempPassword` 邏輯（首次登入 middleware 流程維持不變）
- 不支援 Google OAuth 帳號設定密碼（此為獨立功能，超出範圍）

## Decisions

**D1：新增 `changePassword` action 與 `changePasswordSchema`**

Profile 的變更密碼與首次設定的差異：不修改 `isTempPassword`。
新增 `changePasswordSchema`（或複用現有）→ 建立 `changePassword(formData)` action。

實際上 `changePasswordSchema` 已存在（`lib/schemas/auth.ts`），直接複用。
新 action 邏輯與 `changeTempPassword` 相同，只去掉 `isTempPassword: false` 的更新。

**D2：Profile 變更密碼用獨立 Client Component**

`profile-form.tsx` 已很大，新增 `ChangePasswordCard` 獨立元件於相同目錄，在 `page.tsx` 中掛載於 `SignOutSection` 之前。

**D3：Google OAuth 帳號不顯示變更密碼**

`page.tsx` 判斷 `user.passwordHash !== null`，傳入 `hasPassword` boolean，
`ChangePasswordCard` 有 `hasPassword` prop，為 `false` 時不渲染。

**D4：`/change-password` 版型**

採用與 `/forgot-password` 相同的兩欄品牌版型（`bg-zinc-900` 左側 + 表單右側）。
三個密碼欄各有獨立眼睛 icon 狀態。

## Risks / Trade-offs

- 低風險，主要是 UI 改寫 + 一個新 action
