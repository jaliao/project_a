## Why

目前系統透過隨機 token 產生邀請連結（`/invite/{token}`）讓學員加入課程，增加了不必要的間接層。教師只需分享 `/course/{id}` 直接連結，學員即可在課程頁面直接申請，流程更直觀。

## What Changes

- 移除 `/invite/[token]` 路由及相關頁面
- 移除 `joinInvite(token)` server action（token-based 加入流程）
- 移除 `CourseInvite.token` 欄位（DB schema + migration）
- 移除 middleware 中 `/invite` 公開路徑設定
- 將「複製邀請連結」按鈕改為「複製課程連結」，複製 `/course/{id}` URL
- 移除 `copy-invite-link-button.tsx`（course detail 頁）及 `invite-copy-button.tsx`（invites 頁）中的 token 相依邏輯，改用 courseId

## Capabilities

### New Capabilities

（無新 capability，為既有流程簡化）

### Modified Capabilities

- `course-invite`: 移除 token 欄位與 `/invite/[token]` 加入流程；「複製連結」改為複製 `/course/{id}` URL

## Impact

- `prisma/schema/course-invite.prisma` — 移除 `token` 欄位
- `app/invite/[token]/page.tsx` — 整個路由目錄刪除
- `app/actions/course-invite.ts` — 移除 `joinInvite()` 函式、`createInvite()` 中的 token 產生邏輯
- `app/middleware.ts` — 移除 `/invite` public path
- `app/(user)/course/[id]/copy-invite-link-button.tsx` — 改為複製 `/course/{id}` URL，移除 token prop
- `components/course-invite/invite-copy-button.tsx` — 改為接收 courseId，複製課程 URL
- `components/course-invite/create-invite-form.tsx` — 移除建立後顯示的邀請連結區塊
- `lib/data/course-sessions.ts` — `getCourseSessionById()` 回傳型別移除 `token` 欄位
- 需要新 DB migration 移除 `token` 欄位
