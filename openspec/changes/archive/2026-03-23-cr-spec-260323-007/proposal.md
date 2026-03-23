## Why

教師完成課程訂購後，需要邀請學員加入課程。目前系統缺乏邀請機制，教師無法透過系統生成邀請連結，也無法追蹤學員報名狀態。本次建立完整的「開課邀請」流程：教師產生邀請碼 → 學員點擊連結確認加入 → 教師追蹤報名進度。

## What Changes

- 新增「開課邀請」功能入口（Dashboard 或 Topbar）
- 教師填寫上課人數，系統產生唯一邀請碼與邀請連結，可一鍵複製
- 邀請連結攜帶 token，學員登入後首頁顯示「確認加入課程」對話框
- 教師可查看每個邀請的進度：已邀請人數、已確認人數、各學員狀態

## Capabilities

### New Capabilities
- `course-invite`: 教師建立開課邀請（填寫人數 → 產生邀請碼/連結 → 複製分享）
- `invite-join`: 學員透過邀請連結加入課程（登入後首頁 Dialog 確認）
- `invite-progress`: 教師查看邀請進度（已邀請 vs 已確認，逐一學員狀態）

### Modified Capabilities
- `dashboard-home`: 首頁新增「開課邀請」入口按鈕，及登入後偵測待確認邀請顯示 Dialog

## Impact

- `prisma/schema/course-invite.prisma` — 新增 `CourseInvite`（邀請主體，選填關聯 CourseOrder）、`InviteEnrollment`（學員報名記錄）模型
- `app/actions/course-invite.ts` — Server Actions：createInvite、joinInvite、getInviteProgress
- `lib/schemas/course-invite.ts` — Zod schema
- `app/(user)/dashboard/page.tsx` — 偵測 `?invite=<token>` 參數，顯示確認 Dialog
- `components/course-invite/` — invite-dialog.tsx、invite-progress.tsx、join-invite-dialog.tsx
- `app/api/invite/[token]/route.ts` — 驗證 token（可選，或直接在 middleware 處理重定向）
- 路由：`/invite/[token]` 或透過 `?invite=token` query 參數
- 依賴：nanoid（產生邀請碼）或使用 crypto.randomBytes
