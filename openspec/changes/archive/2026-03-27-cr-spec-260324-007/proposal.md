## Why

Topbar 訊息按鈕目前僅為預留，點擊後無任何動作。使用者需要有一個地方檢視系統發送的通知（如課程邀請、報名確認等），並能瀏覽歷史訊息。

## What Changes

- Topbar 訊息圖示按鈕點擊後開啟訊息通知面板（Drawer 或 Popover）
- 有未讀訊息時，訊息圖示顯示未讀數量 Badge
- 面板內列出所有通知訊息（含標題、內容摘要、時間、已讀/未讀狀態）
- 使用者可標記單則或全部訊息為已讀
- 新增「通知歷史」頁面，可瀏覽完整通知訊息列表

## Capabilities

### New Capabilities
- `notification-inbox`: Topbar 訊息入口面板，顯示最新通知清單、未讀 Badge、標記已讀操作
- `notification-history`: 完整通知歷史頁面（`/notifications`），列出所有系統通知

### Modified Capabilities
- `topbar`: 訊息按鈕從「無動作預留」改為「點擊開啟通知面板」，並在有未讀訊息時顯示 Badge

## Impact

- 新增 `Notification` 資料模型（prisma schema）
- 新增通知相關 Server Actions（`app/actions/notification.ts`）
- 新增通知資料存取層（`lib/data/notification.ts`）
- 修改 Topbar 元件（`components/layout/topbar.tsx`）
- 新增 `/notifications` 頁面路由（`app/(user)/notifications/`）
- 需要 DB migration
