## Why

課程詳情頁「複製邀請連結」按鈕在電腦瀏覽器（不支援 `navigator.share` API）點擊後，只會靜默把連結複製到剪貼簿並顯示一個容易被忽略的小 toast，完全沒有任何說明或引導，導致有老師回報「不知道如何操作」。

調查過程中另外發現一組已經沒有任何 UI 入口可觸達的舊版「開課邀請」流程死碼：`/dashboard` 路由已改為單純轉址（不再渲染 `DashboardActions`），使得 `DashboardActions`／`CreateInviteDialog`／`/invites` 邀請進度頁／`InviteCopyButton` 這條鏈路完全無法被使用者觸及，對應的 OpenSpec 規格（`invite-progress`、`dashboard-home` 部分需求）也早已與實際系統行為脫節。經與使用者確認，一併於本次清除。

## What Changes

- 課程詳情頁「複製邀請連結」按鈕（電腦瀏覽器情境，即不支援 `navigator.share` 時）點擊後改為開啟「分享課程」對話視窗，內含：
  1. 課程連結顯示欄＋複製按鈕（沿用既有複製到剪貼簿邏輯）
  2. 「透過 LINE 分享」按鈕：開啟 LINE 分享連結，帶入邀請文字＋課程連結
  3. 「透過 Email 分享」按鈕：開啟 `mailto:` 連結，帶入邀請主旨與內文（邀請文字＋課程連結）
  4. 「使用系統內建訊息邀請」：輸入對方 Email 或啟動編號，送出後透過系統既有「傳訊息」機制直接發送一則含課程連結的邀請訊息給對方（沿用既有一對一對話則接續最新一筆，否則建立新對話）
  - 手機瀏覽器（支援 `navigator.share`）維持現狀，點擊後直接呼叫系統原生分享面板，不受影響。
- 新增 Server Action `inviteMemberByMessage(inviteId, identifier)`：以既有 `findMemberByIdentifier` 查會員，再透過 `conversation` 模組既有的 `findConversationsWithUser`／`sendConversationMessage`／`startConversation` 送出邀請訊息。
- 清除已無任何 UI 入口可觸達的舊版「開課邀請」流程死碼：
  - 刪除 `components/dashboard/dashboard-actions.tsx`
  - 刪除整個 `components/course-invite/` 目錄（`create-invite-dialog.tsx`／`create-invite-form.tsx`／`invite-copy-button.tsx`）
  - 刪除 `app/[locale]/(user)/invites/page.tsx`（連同其路由目錄）
  - `app/actions/course-invite.ts` 移除隨之無用的 `createInvite`／`getMyInvites`／`getMyOrders`
  - `lib/schemas/course-invite.ts` 移除 `createInviteSchema`／`CreateInviteValues`（保留仍在使用的 `instructorFeedbackSchema`）
  - `messages/zh-TW.json`／`en.json`／`zh-CN.json` 移除 `invites` 命名空間
  - `app/robots.ts` 移除 `/invites` 規則

## Capabilities

### Modified Capabilities
- `course-session-detail`：「講師專屬：複製邀請連結」需求擴充改寫為「講師專屬：課程分享」（新增分享對話視窗與三種邀請管道），並拆出獨立的「講師專屬：聯繫管理者按鈕顯示條件」需求（原內容不變，僅結構拆分）
- `dashboard-home`：移除「開課邀請快速入口」與「查看邀請進度快捷入口」兩則需求——對應元件已無任何 UI 入口可觸達，隨死碼一併清除

### Removed Capabilities
- `invite-progress`：`/invites` 邀請進度頁整頁移除（無任何 UI 入口可觸達，功能死碼）

## Impact

- **元件**：`app/[locale]/(user)/course/[id]/copy-invite-link-button.tsx`（擴充為分享 Dialog，電腦瀏覽器分支改開 Dialog 而非直接複製；元件名稱與檔案位置維持不變，避免不必要的搬移）。
- **Server Actions**：`app/actions/course-invite.ts` 新增 `inviteMemberByMessage`，移除 `createInvite`／`getMyInvites`／`getMyOrders`。
- **刪除檔案**：`components/dashboard/dashboard-actions.tsx`、`components/course-invite/`（整個目錄）、`app/[locale]/(user)/invites/`（整個目錄）。
- **i18n**：`messages/zh-TW.json`／`en.json` 於 `course.copyLink` 命名空間新增分享 Dialog 相關文案（`npm run gen:zh-cn` 重新產生 `zh-CN`）；移除 `invites` 命名空間（三語系）。
- **其他**：`lib/schemas/course-invite.ts` 移除 `createInviteSchema`；`app/robots.ts` 移除 `/invites` disallow 規則。
- 不影響 Prisma schema／migration；不影響既有 `applyToCourse`／`inviteBySpirtId`／`conversation` 模組的既有行為（純新增呼叫、不修改既有函式邏輯）。
