## ADDED Requirements

### Requirement: 學習單元區塊
Dashboard SHALL 顯示「學習」功能單元，包含「加入學習」與「學習紀錄」兩個入口。

#### Scenario: 顯示學習單元
- **WHEN** 任何已登入使用者進入 `/dashboard`
- **THEN** 頁面顯示學習單元區塊，包含「加入學習」按鈕（disabled）與「學習紀錄」連結（導向 `/learning`）

#### Scenario: 加入學習按鈕為佔位
- **WHEN** 使用者點擊「加入學習」按鈕
- **THEN** 按鈕為 disabled 狀態，無任何功能觸發

### Requirement: 授課單元區塊
Dashboard SHALL 顯示「授課」功能單元，包含「新增開課」與「開課查詢」兩個入口。

#### Scenario: 顯示授課單元
- **WHEN** 任何已登入使用者進入 `/dashboard`
- **THEN** 頁面顯示授課單元區塊，包含「新增開課」按鈕（開啟 CourseSessionDialog）與「開課查詢」按鈕（disabled）

#### Scenario: 新增開課開啟 Dialog
- **WHEN** 使用者點擊「新增開課」按鈕
- **THEN** 系統開啟 CourseSessionDialog

#### Scenario: 開課查詢按鈕為佔位
- **WHEN** 使用者點擊「開課查詢」按鈕
- **THEN** 按鈕為 disabled 狀態，無任何功能觸發

### Requirement: 管理者單元區塊（角色限制）
Dashboard SHALL 僅對 `admin` 或 `superadmin` 角色的使用者顯示「管理者」功能單元。

#### Scenario: 管理者角色顯示管理者單元
- **WHEN** session.user.role 為 `admin` 或 `superadmin` 的使用者進入 `/dashboard`
- **THEN** 頁面顯示管理者單元，包含連結至 `/admin` 的入口按鈕

#### Scenario: 一般使用者不顯示管理者單元
- **WHEN** session.user.role 為 `user` 的使用者進入 `/dashboard`
- **THEN** 頁面不顯示管理者單元區塊
