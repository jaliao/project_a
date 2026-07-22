# topbar Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for topbar.

## Requirements

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

### Requirement: 媒合布告欄按鈕
Topbar 右上角按鈕群組 SHALL 包含「媒合布告欄」按鈕（圖示），所有登入會員皆可見，點擊後導向媒合布告欄 `/match-board`。

#### Scenario: 顯示媒合布告欄按鈕
- **WHEN** 任何登入會員檢視 Topbar
- **THEN** 右上角顯示「媒合布告欄」按鈕（不需特定身分）

#### Scenario: 點擊前往布告欄
- **WHEN** 會員點擊「媒合布告欄」按鈕
- **THEN** 導向 `/match-board`

### Requirement: 我需要幫助按鈕
Topbar 右側操作按鈕群組 SHALL 包含「聯絡管理者」圖示按鈕，位於「訊息通知」按鈕左邊，所有已登入會員皆可見，點擊後導向個人專區「我的提問」頁面（不彈出對話框）。

#### Scenario: 顯示聯絡管理者按鈕
- **WHEN** 任何已登入會員檢視 Topbar
- **THEN** 右側按鈕群組於「訊息通知」按鈕左邊顯示「聯絡管理者」圖示按鈕（不需特定身分）

#### Scenario: 點擊聯絡管理者按鈕
- **WHEN** 會員點擊「聯絡管理者」按鈕
- **THEN** 導向 `/user/{spiritId}/inquiries` 頁面（見 `contact-admin` capability）
