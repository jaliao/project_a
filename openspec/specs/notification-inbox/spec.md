## ADDED Requirements

### Requirement: 訊息 Drawer 面板
系統 SHALL 在使用者點擊 Topbar 訊息圖示後，從右側滑入 Drawer（Sheet）顯示最新通知列表（最多 20 則），依建立時間倒序排列。

#### Scenario: 開啟通知 Drawer
- **WHEN** 使用者點擊 Topbar 訊息圖示按鈕
- **THEN** 右側滑入 Drawer，顯示標題「通知」與通知列表

#### Scenario: 通知列表為空
- **WHEN** 使用者開啟 Drawer 且無任何通知
- **THEN** Drawer 顯示空狀態提示訊息「目前沒有通知」

### Requirement: 通知項目顯示
每則通知項目 SHALL 顯示：標題、內容摘要（最多 2 行）、建立時間（相對時間，如「3 分鐘前」）、已讀／未讀視覺區分（未讀項目有明顯標示）。

#### Scenario: 顯示未讀通知
- **WHEN** 通知的 `isRead` 為 `false`
- **THEN** 該通知項目顯示未讀標示（如左側色條或背景色差異）

#### Scenario: 顯示已讀通知
- **WHEN** 通知的 `isRead` 為 `true`
- **THEN** 該通知項目以較低對比度顯示，無未讀標示

### Requirement: 標記單則已讀
系統 SHALL 允許使用者點擊個別未讀通知，將其標記為已讀（`isRead = true`，記錄 `readAt`）。

#### Scenario: 點擊未讀通知
- **WHEN** 使用者點擊一則未讀通知
- **THEN** 系統呼叫 `markNotificationRead(id)`，更新狀態，Topbar Badge 數字減少

### Requirement: 標記全部已讀
系統 SHALL 在 Drawer 頂部提供「全部標為已讀」按鈕，一次將該使用者所有未讀通知標記為已讀。

#### Scenario: 點擊全部已讀
- **WHEN** 使用者點擊「全部標為已讀」
- **THEN** 系統呼叫 `markAllNotificationsRead(userId)`，所有通知變為已讀，Badge 消失

#### Scenario: 無未讀時按鈕狀態
- **WHEN** 所有通知皆已讀
- **THEN** 「全部標為已讀」按鈕為 disabled 狀態

### Requirement: 未讀數量 Badge
Topbar 訊息圖示 SHALL 在有未讀通知時顯示紅色數字 Badge，數字代表未讀則數；無未讀通知時不顯示 Badge。

#### Scenario: 有未讀通知
- **WHEN** 使用者載入頁面且該使用者有 1 則以上未讀通知
- **THEN** 訊息圖示右上角顯示紅色數字 Badge，數字為未讀則數

#### Scenario: 無未讀通知
- **WHEN** 使用者載入頁面且未讀通知數為 0
- **THEN** 訊息圖示不顯示 Badge
