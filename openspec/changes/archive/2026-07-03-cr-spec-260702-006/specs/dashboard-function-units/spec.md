# dashboard-function-units Delta（cr-spec-260702-006）

## MODIFIED Requirements

### Requirement: 學習單元區塊
Dashboard SHALL 僅對非管理者角色顯示「學習」功能單元，包含「加入學習」入口。`admin` 及 `superadmin` 角色不顯示學習單元。學習單元 SHALL NOT 提供導向 `/learning` 之連結（該頁面已移除；學習進度改於個人首頁基本資料區塊呈現）。

#### Scenario: 一般使用者顯示學習單元
- **WHEN** session.user.role 為 `user` 的使用者進入 `/dashboard`
- **THEN** 頁面顯示學習單元區塊，包含「加入學習」按鈕（disabled），無「學習紀錄」連結

#### Scenario: 管理者不顯示學習單元
- **WHEN** session.user.role 為 `admin` 或 `superadmin` 的使用者進入 `/dashboard`
- **THEN** 頁面不顯示學習單元區塊

#### Scenario: 加入學習按鈕為佔位
- **WHEN** 使用者點擊「加入學習」按鈕
- **THEN** 按鈕為 disabled 狀態，無任何功能觸發
