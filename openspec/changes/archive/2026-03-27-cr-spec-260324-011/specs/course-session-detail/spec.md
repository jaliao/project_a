## ADDED Requirements

### Requirement: 課程詳情頁路由
系統 SHALL 提供 `/course/[id]` 路由，顯示單一開課（CourseInvite）的完整資訊，僅限已登入使用者存取。

#### Scenario: 有效課程 ID
- **WHEN** 已登入使用者存取 `/course/123`（id=123 存在）
- **THEN** 頁面顯示該課程的完整資訊

#### Scenario: 無效課程 ID
- **WHEN** 使用者存取不存在的課程 ID
- **THEN** 頁面顯示 404 或「找不到課程」提示

### Requirement: 顯示授課老師
課程詳情頁 SHALL 顯示 `CourseInvite.createdBy` 的姓名（name 或 nickname）與 Email。

#### Scenario: 顯示授課老師資訊
- **WHEN** 使用者開啟課程詳情頁
- **THEN** 頁面顯示授課老師姓名與 Email

### Requirement: 顯示已接受學員名單
課程詳情頁 SHALL 顯示所有 `InviteEnrollment` 記錄對應的學員清單，包含姓名、Email 與加入時間。

#### Scenario: 有學員加入
- **WHEN** 課程有至少一筆 InviteEnrollment
- **THEN** 頁面顯示每位學員的姓名、Email、joinedAt

#### Scenario: 尚無學員
- **WHEN** 課程無任何 InviteEnrollment
- **THEN** 頁面顯示「尚無學員加入」空狀態

### Requirement: 顯示課程取消狀態
若課程已取消（cancelledAt 不為 null），詳情頁 SHALL 顯示「已取消」標籤與取消原因。

#### Scenario: 課程已取消
- **WHEN** CourseInvite.cancelledAt 不為 null
- **THEN** 頁面頂部顯示「已取消」狀態標籤，並顯示取消原因文字

#### Scenario: 課程未取消
- **WHEN** CourseInvite.cancelledAt 為 null
- **THEN** 頁面不顯示取消相關資訊

### Requirement: 結業申請按鈕
課程詳情頁底部 SHALL 顯示「結業申請」按鈕，本期為 UI 佔位，點擊不觸發後端動作。

#### Scenario: 點擊結業申請
- **WHEN** 使用者點擊「結業申請」按鈕
- **THEN** 顯示「功能即將開放」提示（toast 或 disabled 狀態）
