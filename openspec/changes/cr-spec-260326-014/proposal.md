## Why

目前課程結業為全體學員一次性結業，且沒有逐學員的結業憑證機制。需要讓講師在結業時選擇哪些學員通過，通過的學員獲得結業證明，並在學員頁面與學習紀錄中可見。

## What Changes

- 「複製課程連結」按鈕改為「分享」（優先使用 Web Share API，不支援時 fallback 複製連結）
- 結業操作改為 Dialog，讓講師勾選通過結業的學員後才執行結業
- `InviteEnrollment` 新增 `graduatedAt` 欄位，記錄每位學員的結業時間
- 新增結業證明卡片：在學員頁面顯示，每個課程等級僅顯示一張（參加多次取最早/最新一張）
- 學習紀錄頁（`/learning`）新增「結業紀錄」區塊
- 學員頁面（`/user/[spiritId]`）新增「學習紀錄」預覽區塊，顯示最近 N 筆，附「查看更多」連結

## Capabilities

### New Capabilities

- `course-graduation`: 結業 Dialog 讓講師選擇通過結業的學員，寫入 `InviteEnrollment.graduatedAt`
- `completion-certificate`: 結業證明卡片元件，顯示課程等級、講師、結業日期；每個等級只顯示一張

### Modified Capabilities

- `learning-records`: 新增「結業紀錄」區塊，顯示學員通過結業的課程列表
- `user-profile`: 學員頁面新增「學習紀錄」預覽區塊（最近 3 筆 + 「查看更多」跳至 `/learning`）
- `course-invite`: 分享按鈕取代複製按鈕（Web Share API + clipboard fallback）

## Impact

- `prisma/schema/course-invite.prisma` — `InviteEnrollment` 新增 `graduatedAt DateTime?`
- `app/actions/course-invite.ts` — `graduateCourse()` 改為接收通過學員 ID 清單，批次更新 `graduatedAt`
- `app/(user)/course/[id]/course-detail-actions.tsx` — 結業按鈕改開 graduation dialog
- `app/(user)/course/[id]/` — 新增 `graduation-dialog.tsx`（勾選學員 UI）
- `app/(user)/course/[id]/copy-invite-link-button.tsx` — 改為 share button
- `lib/data/course-sessions.ts` — `getCourseSessionById()` 回傳 enrollment 包含 `graduatedAt`
- `app/(user)/learning/page.tsx` — 新增結業紀錄區塊
- `app/(user)/user/[spiritId]/page.tsx` — 新增學習紀錄預覽區塊
- 新增 `components/course-invite/completion-certificate-card.tsx`
- 新 DB migration
