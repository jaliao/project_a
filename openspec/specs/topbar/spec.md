## ADDED Requirements

### Requirement: Topbar 共用元件
`(user)` layout SHALL 在所有已登入頁面頂部渲染 Topbar 元件，包含：系統標題、右側操作按鈕群組。

#### Scenario: 已登入頁面顯示 Topbar
- **WHEN** 已登入使用者存取任何 `(user)` 路由下的頁面
- **THEN** 頁面頂部顯示 Topbar

### Requirement: 新增課程按鈕
Topbar SHALL 包含「新增課程」按鈕（圖示 + 文字），點擊後開啟課程訂購 Dialog。

#### Scenario: 點擊新增課程按鈕
- **WHEN** 使用者點擊「新增課程」按鈕
- **THEN** 系統開啟課程訂購表單 Dialog（CourseOrderDialog）

### Requirement: 個人資料按鈕
Topbar SHALL 包含「個人資料」圖示按鈕，點擊後導向 `/profile`。

#### Scenario: 點擊個人資料按鈕
- **WHEN** 使用者點擊個人資料按鈕
- **THEN** 系統導向 `/profile` 頁面

### Requirement: 訊息通知按鈕
Topbar SHALL 包含「訊息」圖示按鈕。現階段 Badge 不顯示（未讀數為 0 時不顯示角標）。

#### Scenario: 無未讀訊息時
- **WHEN** 使用者載入任何頁面且未讀訊息數為 0
- **THEN** 訊息圖示不顯示數字 Badge

#### Scenario: 點擊訊息按鈕
- **WHEN** 使用者點擊訊息按鈕
- **THEN** 系統執行預留動作（現階段不開啟任何面板）
