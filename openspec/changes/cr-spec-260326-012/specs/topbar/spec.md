## MODIFIED Requirements

### Requirement: Topbar 共用元件
`(user)` layout SHALL 在所有已登入頁面頂部渲染 Topbar 元件，包含：系統標題、右側操作按鈕群組。Topbar SHALL 採用 sticky 定位（`sticky top-0`），確保頁面滾動後仍維持可見與可操作。

#### Scenario: 已登入頁面顯示 Topbar
- **WHEN** 已登入使用者存取任何 `(user)` 路由下的頁面
- **THEN** 頁面頂部顯示 Topbar

#### Scenario: 長頁面滾動後 Topbar 仍可見
- **WHEN** 使用者在長頁面（如 `/course/[id]`）向下滾動
- **THEN** Topbar 固定於視窗頂部，個人資料與訊息中心按鈕維持可點擊

### Requirement: 個人資料按鈕
Topbar SHALL 包含「個人資料」圖示按鈕，點擊後導向 `/profile`。

#### Scenario: 點擊個人資料按鈕
- **WHEN** 使用者點擊個人資料按鈕
- **THEN** 系統導向 `/profile` 頁面

### Requirement: 訊息通知按鈕
Topbar SHALL 包含「訊息」圖示按鈕，點擊後開啟通知抽屜（NotificationDrawer）。有未讀訊息時顯示紅色計數角標（最大顯示 99+）。

#### Scenario: 無未讀訊息時
- **WHEN** 使用者載入任何頁面且未讀訊息數為 0
- **THEN** 訊息圖示不顯示數字 Badge

#### Scenario: 有未讀訊息時
- **WHEN** 使用者載入任何頁面且未讀訊息數大於 0
- **THEN** 訊息圖示右上角顯示紅色計數角標

#### Scenario: 點擊訊息按鈕
- **WHEN** 使用者點擊訊息按鈕
- **THEN** 系統開啟通知抽屜（NotificationDrawer）

## REMOVED Requirements

### Requirement: 新增課程按鈕
**Reason**: 新增課程入口已由 `/user/[spiritId]` 授課單元的 CourseSessionDialog 覆蓋，Topbar 放置對學員角色造成干擾。
**Migration**: 新增課程請使用學員首頁授課單元中的「新增開課」按鈕。
