## Context

Topbar 訊息按鈕目前為預留狀態（點擊無動作，Badge 永不顯示）。本次要實作完整的訊息通知系統，包含：資料模型、Drawer 面板、歷史頁面。

現有 Topbar 元件位於 `components/layout/topbar.tsx`，已有訊息圖示按鈕的 UI 佔位。

## Goals / Non-Goals

**Goals:**
- 點擊訊息按鈕開啟右側 Drawer，列出最新通知（最多 20 則）
- 有未讀訊息時顯示紅色數字 Badge
- 支援標記單則已讀、全部已讀
- `/notifications` 頁面：完整通知歷史，支援分頁
- 新增 `Notification` DB model 與 migration

**Non-Goals:**
- 即時推播（WebSocket / SSE）— 本期僅做 polling 或頁面載入時抓取
- 通知分類篩選（本期統一顯示）
- Email 通知發送

## Decisions

### D1：UI 元件使用 Drawer（Right Side）
**決定：** 使用 shadcn/ui `Sheet`（Right Drawer）而非 Popover。
**原因：** 通知列表可能有多則，Drawer 有足夠垂直空間；手機端體驗較好；符合使用者要求。
**替代方案：** Popover — 空間有限，手機端較差。

### D2：資料模型設計
```
Notification {
  id          Int      @id @default(autoincrement())
  userId      String   @db.Uuid
  title       String
  body        String
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
}
```
**決定：** 每則通知屬於特定使用者，獨立 `isRead` 欄位。
**原因：** 簡單直觀，支援按使用者查詢未讀數量；未來可擴充 `type`、`link` 欄位。

### D3：未讀數量取得方式
**決定：** Topbar 為 Server Component，在 layout 層 fetch 未讀數（`getUnreadNotificationCount(userId)`），傳入 Topbar。
**原因：** 避免 client-side hydration 閃爍；每次頁面導航自動刷新。
**替代方案：** Client-side fetch — 需要額外 API route 或 SWR，複雜度較高。

### D4：Drawer 資料載入
**決定：** Drawer 為 Client Component，開啟時透過 Server Action 載入最新 20 則通知（lazy load）。
**原因：** 不需要在每次頁面載入時抓取全部通知內容，降低初始載入成本。

### D5：標記已讀
**決定：** 點擊單則通知 → 呼叫 Server Action `markNotificationRead(id)`；全部已讀 → `markAllNotificationsRead(userId)`。兩者都 `revalidatePath` 刷新未讀數。

## Risks / Trade-offs

- **未讀數延遲**：Drawer 開啟後標記已讀，但 Topbar Badge 需等下次導航才刷新 → 可接受（不做即時更新）
- **通知數量龐大時效能**：`/notifications` 頁面加分頁（每頁 20 則）緩解
- **通知產生時機**：本期通知需手動在 Server Action 中呼叫 `createNotification()`，尚無統一事件機制

## Migration Plan

1. 新增 `Notification` model 至 `prisma/schema/user.prisma`
2. 執行 `make schema-update name=add_notification_model`
3. 部署至 VPS3：`make prisma-vps3-deploy`
