## Why

會員登入後缺乏個人化歡迎體驗，且資料填寫不完整時沒有任何提示，導致通訊 email、電話等重要聯絡資訊容易缺漏。同時 Profile 頁面缺少登出入口，使用體驗不完整。

## What Changes

- Dashboard 首頁依會員資料完整度顯示不同內容：
  - 資料未完整（realName、commEmail、phone 任一空白）→ 顯示提醒 Banner，引導前往 `/profile` 填寫
  - 資料已完整 → 顯示「歡迎回來，XXX！」歡迎訊息（使用 realName 或 name）
- `User` 模型新增 `nickname` 欄位（`String?`）
- Profile 表單「基本資料」區塊新增暱稱輸入欄位
- Profile 頁面新增「登出」按鈕（獨立 section，呼叫 NextAuth `signOut`）

## Capabilities

### New Capabilities
- `profile-completion-banner`: Dashboard 首頁依資料完整度顯示提醒 Banner 或歡迎訊息
- `profile-nickname`: User 模型新增 nickname 欄位，並整合至 Profile 表單

### Modified Capabilities
（無現有 spec 需異動）

## Impact

- `prisma/schema/user.prisma` — 新增 `nickname String?`
- `app/(user)/dashboard/page.tsx` — 傳入當前登入使用者資料給新 Banner 元件
- `components/dashboard/` — 新增 `profile-banner.tsx`（Server 或 Client Component）
- `app/(user)/profile/profile-form.tsx` — 新增 nickname 欄位
- `lib/schemas/profile.ts` — 新增 nickname 到 updateProfileSchema
- `app/actions/profile.ts` — updateProfile 支援儲存 nickname
- `app/(user)/profile/page.tsx` — 新增登出按鈕區塊
- 需一次 Prisma migration（add_nickname）
