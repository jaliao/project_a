## 1. 資料庫模型

- [x] 1.1 在 `prisma/schema/user.prisma` 新增 `Notification` model（id、userId、title、body、isRead、readAt、createdAt）
- [x] 1.2 執行 `make schema-update name=add_notification_model` 產生 migration 並重新生成 Prisma client

## 2. 資料存取層

- [x] 2.1 新增 `lib/data/notification.ts`，實作 `getNotifications(userId, limit)`（取最新 N 則）
- [x] 2.2 實作 `getUnreadNotificationCount(userId)` 回傳未讀則數
- [x] 2.3 實作 `getNotificationsPaginated(userId, page, pageSize)` 供歷史頁面使用

## 3. Server Actions

- [x] 3.1 新增 `app/actions/notification.ts`，實作 `markNotificationRead(id)` Server Action
- [x] 3.2 實作 `markAllNotificationsRead(userId)` Server Action
- [x] 3.3 兩個 Action 完成後均呼叫 `revalidatePath` 刷新受影響頁面

## 4. Topbar 修改

- [x] 4.1 在 `app/(user)/layout.tsx` 呼叫 `getUnreadNotificationCount(userId)` 取得未讀數
- [x] 4.2 修改 `components/layout/topbar.tsx`，接收 `unreadCount` prop
- [x] 4.3 訊息圖示按鈕有未讀時顯示紅色數字 Badge（`unreadCount > 0`）

## 5. 通知 Drawer（notification-inbox）

- [x] 5.1 新增 `components/notification/notification-drawer.tsx`（Client Component，使用 shadcn/ui Sheet）
- [x] 5.2 Drawer 開啟時呼叫 Server Action 載入最新 20 則通知（lazy load）
- [x] 5.3 實作通知項目列表，顯示標題、摘要、相對時間、已讀／未讀視覺區分
- [x] 5.4 加入「全部標為已讀」按鈕（無未讀時為 disabled）
- [x] 5.5 點擊單則未讀通知時呼叫 `markNotificationRead(id)`
- [x] 5.6 Drawer 底部加入「查看全部通知」連結（→ `/notifications`）
- [x] 5.7 將 NotificationDrawer 整合至 Topbar，訊息按鈕點擊觸發 Drawer 開啟

## 6. 通知歷史頁面（notification-history）

- [x] 6.1 新增 `app/(user)/notifications/page.tsx`（Server Component）
- [x] 6.2 頁面使用 `getNotificationsPaginated` 取得分頁資料，支援 `?page=` query param
- [x] 6.3 實作通知列表，顯示標題、內容摘要、絕對時間、已讀／未讀狀態
- [x] 6.4 實作分頁元件（總數 > 20 時顯示）
- [x] 6.5 實作空狀態 UI

## 7. 版本與文件

- [x] 7.1 更新 `config/version.json` patch 版本號 +1
- [x] 7.2 依照 `.ai-rules.md` 重新產生 `README-AI.md`
