## ADDED Requirements

### Requirement: 登入後首頁路由
系統 SHALL 提供 `/dashboard` 路由作為所有已登入使用者的預設落點。未登入存取時 SHALL 重定向至 `/login`。

#### Scenario: 已登入使用者直接存取
- **WHEN** 已登入使用者存取 `/dashboard`
- **THEN** 系統顯示首頁內容，不執行重定向

#### Scenario: 未登入使用者存取
- **WHEN** 未登入使用者存取 `/dashboard`
- **THEN** 系統重定向至 `/login?callbackUrl=/dashboard`

#### Scenario: 登入後預設導向
- **WHEN** 使用者成功登入且無指定 `callbackUrl`
- **THEN** 系統導向 `/dashboard`

### Requirement: 根路徑重定向
系統 SHALL 在 `app/page.tsx` 處理根路徑 `/`：未登入由 middleware 攔截導向 `/login`；已登入執行 server-side redirect 至 `/dashboard`。

#### Scenario: 已登入使用者存取根路徑
- **WHEN** 已登入使用者存取 `/`
- **THEN** 系統重定向至 `/dashboard`

#### Scenario: 未登入使用者存取根路徑
- **WHEN** 未登入使用者存取 `/`
- **THEN** middleware 攔截並重定向至 `/login?callbackUrl=/`

### Requirement: 統計卡片區
首頁 SHALL 顯示至少三張統計卡片，各卡片包含：圖示、數值、標題。

#### Scenario: 顯示會員總數
- **WHEN** 使用者載入首頁
- **THEN** 統計卡片顯示系統中會員（User）的總數

#### Scenario: 顯示本月新增會員數
- **WHEN** 使用者載入首頁
- **THEN** 統計卡片顯示當月（依伺服器時間）新加入的會員數

#### Scenario: 顯示活躍會員數
- **WHEN** 使用者載入首頁
- **THEN** 統計卡片顯示 `isActive = true` 的會員數

### Requirement: 近期活動列表
首頁 SHALL 顯示最近 10 筆會員加入記錄，包含：會員名稱、Email、加入時間（相對時間）。

#### Scenario: 有活動記錄時
- **WHEN** 使用者載入首頁且資料庫有會員資料
- **THEN** 列表顯示最新 10 筆，依 `createdAt` 降冪排列

#### Scenario: 無活動記錄時
- **WHEN** 系統中尚無會員資料
- **THEN** 顯示空狀態提示文字「尚無活動記錄」
