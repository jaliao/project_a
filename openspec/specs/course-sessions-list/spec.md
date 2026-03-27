## ADDED Requirements

### Requirement: 開課查詢頁路由
系統 SHALL 提供 `/course-sessions` 路由，已登入使用者可存取，顯示該使用者所有開課記錄。

#### Scenario: 已登入使用者存取
- **WHEN** 已登入使用者存取 `/course-sessions`
- **THEN** 系統顯示該使用者建立的所有開課記錄，依建立時間降冪排列

#### Scenario: 未登入使用者存取
- **WHEN** 未登入使用者存取 `/course-sessions`
- **THEN** middleware 重定向至 `/login`

### Requirement: 開課查詢頁顯示全部記錄（含已結束）
開課查詢頁 SHALL 顯示該教師建立的所有 CourseInvite，包含已過期（expiredAt < 今日）的記錄。

#### Scenario: 有開課記錄
- **WHEN** 使用者存取開課查詢頁且有開課記錄
- **THEN** 系統顯示全部記錄，每筆使用 CourseSessionCard（variant="full"）呈現

#### Scenario: 無開課記錄
- **WHEN** 使用者存取開課查詢頁且尚無任何開課記錄
- **THEN** 系統顯示「尚無開課記錄」空狀態提示

### Requirement: 開課查詢頁標題與返回連結
開課查詢頁 SHALL 顯示頁面標題「開課查詢」，並提供返回 Dashboard 的連結。

#### Scenario: 頁面頂部
- **WHEN** 使用者進入開課查詢頁
- **THEN** 頁面顯示「開課查詢」標題與「← 返回首頁」連結
