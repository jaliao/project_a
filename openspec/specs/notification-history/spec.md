## ADDED Requirements

### Requirement: 通知歷史頁面路由
系統 SHALL 提供 `/notifications` 路由，供已登入使用者瀏覽完整通知歷史。

#### Scenario: 存取通知歷史頁面
- **WHEN** 已登入使用者存取 `/notifications`
- **THEN** 頁面顯示該使用者所有通知，依建立時間倒序排列

#### Scenario: 未登入存取
- **WHEN** 未登入使用者存取 `/notifications`
- **THEN** 系統重新導向至 `/login`

### Requirement: 通知歷史列表
通知歷史頁面 SHALL 以列表形式顯示所有通知，每則顯示：標題、內容摘要、建立時間（絕對時間）、已讀／未讀狀態。

#### Scenario: 列表有通知
- **WHEN** 使用者進入通知歷史頁面且有通知資料
- **THEN** 頁面顯示所有通知的完整列表

#### Scenario: 列表為空
- **WHEN** 使用者進入通知歷史頁面且無任何通知
- **THEN** 頁面顯示「目前沒有通知紀錄」空狀態

### Requirement: 通知歷史分頁
系統 SHALL 支援每頁 20 則的分頁，當通知總數超過 20 則時顯示分頁控制元件。

#### Scenario: 通知超過一頁
- **WHEN** 使用者的通知總數超過 20 則
- **THEN** 頁面底部顯示分頁控制，使用者可切換頁面

#### Scenario: 通知不超過一頁
- **WHEN** 通知總數 ≤ 20 則
- **THEN** 不顯示分頁控制元件

### Requirement: 從 Drawer 進入歷史頁面
Drawer 底部 SHALL 提供「查看全部通知」連結，點擊後導向 `/notifications`。

#### Scenario: 點擊查看全部
- **WHEN** 使用者在 Drawer 內點擊「查看全部通知」
- **THEN** 系統導向 `/notifications` 並關閉 Drawer
