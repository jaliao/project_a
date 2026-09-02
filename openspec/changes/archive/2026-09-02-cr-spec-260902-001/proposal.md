## Why

需求單 CR-SPEC-260902-001（提出人：廖柏嘉 Justin，2026-09-02，所屬專案 P26021 Project A 啟動靈人系統）：**「社群優化」**。原文三點：

1. **我的行動條碼**的功能需要**置中**，可以用彈跳視窗。
2. 在手機板「我的行動條碼」會**自動彈出鍵盤，擋住 QR Code**，希望不要自動跳出鍵盤。
3. 傳訊息給某人時，會**自動跳到群組訊息**（例如正式環境的「早安，啟動事工系統工作小組」），不要轉到群組，要轉到**個人**的對話。

現況（相關 CR 皆已上線並封存：cr-spec-260901-003 加好友、004 訊息頁手機版面、007 好友小優化）：

- **加好友介面**：`components/community/add-friend-drawer.tsx`（client）以 `Sheet side="bottom"`（底部滑出面板）呈現，`SheetContent` 帶 `mx-auto max-w-md`。內含「我的行動條碼」與「掃描行動條碼」兩檢視，預設「我的行動條碼」：QR（`QRCodeCanvas size=200`）＋明碼啟動編號＋「輸入啟動編號」`<Input>`＋「加入」鈕＋「切換掃描行動條碼」鈕。
  - 底部滑出面板使 QR 貼齊畫面下緣，非畫面中央（對應第 1 點「需要置中」）。
  - `Sheet`／`Dialog` 皆為 Radix Dialog；開啟時 Radix 預設 `onOpenAutoFocus` 會聚焦內容區第一個可聚焦元素＝「輸入啟動編號」`<Input>`，行動瀏覽器隨即彈出軟體鍵盤蓋住 QR（對應第 2 點）。
- **「傳訊息」入口**：`components/conversation/messages-page.tsx` `openWithUser(targetUserId)` → `fetchConversationsWithUser(targetUserId)` → `lib/data/conversation.ts` `findConversationsWithUser(viewerId, targetUserId)`，其 `where` 僅要求「兩人各自都在參與者中」（`AND: [{ participants: { some: { userId: viewerId } } }, { participants: { some: { userId: targetUserId } } }]`），**不排除多人群組**。因此當雙方同屬某個群組對話、且該群組「最後訊息時間」較新時，`openWithUser` 取「最新一筆」就落到**群組**而非兩人一對一對話（對應第 3 點）。
  - `?with=` 深連結（學員專頁 `send-message-button.tsx`、後台會員標籤 `member-tag.tsx`）與社群「好友」卡片「傳訊息」都走同一條 `openWithUser`，同樣受影響。
  - 尚無一對一對話時 `startNewWithTarget` → `previewNewConversationWithUser` → 送出時 `startConversation(targetUserId, body)` 建立的本就是兩人對話，無需改。

## What Changes

1. **加好友介面由「底部滑出面板」改為「置中彈窗」（modal dialog）**：`Sheet` → `Dialog`（`components/ui/dialog.tsx`），內容覆蓋畫面中央；「我的行動條碼」檢視內 QR 與明碼編號維持水平置中。行為（兩檢視切換、掃碼加好友、相機釋放、手動輸入、關閉重置）不變。
2. **彈窗開啟時不自動聚焦文字輸入欄位**：`DialogContent` 加 `onOpenAutoFocus={(e) => e.preventDefault()}`，避免行動裝置自動彈出軟體鍵盤遮擋行動條碼；使用者仍可手動點入「輸入啟動編號」欄位。
3. **「傳訊息」入口只鎖定一對一對話**：`findConversationsWithUser` 的 `where` 增補「排除含第三人的對話」條件（參與者集合恰為 `{viewer, target}`），使所有「傳訊息」入口與 `?with=` 深連結**只**開啟／接續與對方的**一對一**對話（多筆一對一時仍取「最後訊息時間最新」的一筆；無則進新對話畫面），**不再**跳進雙方共同所屬的群組。既有群組對話仍可從頻道列表各自開啟。

**影響檔案**：`components/community/add-friend-drawer.tsx`（→ 更名 `add-friend-dialog.tsx`）、`components/conversation/messages-page.tsx`（import 名稱）、`lib/data/conversation.ts`（`findConversationsWithUser` where）、`doc/` 三手冊（加好友彈窗描述）、`config/version.json`、`ai-context/`。

## Impact

- **Affected specs**：`community-friends`（加好友介面：Drawer → 置中彈窗＋不自動聚焦；「點好友開對話」捷徑：限一對一）、`contact-member`（各頁面「傳訊息」入口：既有對話 = 一對一直接對話，排除共同群組）。
- **Affected code**：`components/community/add-friend-drawer.tsx`（更名為 `add-friend-dialog.tsx`、`Sheet`→`Dialog`、`onOpenAutoFocus` 阻止預設）、`components/conversation/messages-page.tsx`（改 import `AddFriendDialog`）、`lib/data/conversation.ts`（`findConversationsWithUser` where 增排除第三人）。
- **無 DB schema 變更**；純前端行為＋一處資料層查詢條件收斂，部署即生效。
- **相容性**：`findConversationsWithUser` 收斂後只少回傳「含第三人的對話」，不影響既有一對一對話資料；線上既有群組對話不受影響（頻道列表照舊）。
- **非目標**：不改單向好友模型、加好友通知、移除／釘選好友、好友搜尋／分頁、傳訊息授權（非好友仍可互傳）、訊息頁籤既有版面與互動、群組對話建立／成員管理、Topbar 社群入口。
