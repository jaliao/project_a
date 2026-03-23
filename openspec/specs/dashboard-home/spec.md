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

### Requirement: 開課邀請快速入口
首頁 SHALL 在統計卡片區下方或操作區新增「開課邀請」按鈕，點擊後開啟建立邀請 Dialog。

#### Scenario: 點擊開課邀請按鈕
- **WHEN** 教師點擊首頁「開課邀請」按鈕
- **THEN** 系統開啟建立邀請 Dialog（CreateInviteDialog）

### Requirement: 查看邀請進度快捷入口
首頁 SHALL 提供「查看邀請進度」連結，點擊後導向 `/invites`。

#### Scenario: 點擊查看邀請進度
- **WHEN** 使用者點擊「查看邀請進度」連結
- **THEN** 系統導向 `/invites`

### Requirement: 加入課程成功 toast
首頁 SHALL 偵測 `?enrolled=1` query param，若存在則顯示「已成功加入課程！」toast，並清除 query param（避免重新整理重複顯示）。

#### Scenario: 從邀請連結加入後顯示 toast
- **WHEN** 使用者被導向 `/dashboard?enrolled=1`
- **THEN** 首頁顯示「已成功加入課程！」toast

#### Scenario: 直接訪問首頁不顯示 toast
- **WHEN** 使用者直接訪問 `/dashboard`
- **THEN** 不顯示加入課程 toast

### Requirement: 首頁顯示「新增開課」區塊
首頁 SHALL 在統計卡片下方新增「新增開課」區塊，包含「新增開課」按鈕與已接受邀請的學員清單。

#### Scenario: 進入首頁
- **WHEN** 已登入使用者進入 `/dashboard`
- **THEN** 頁面顯示「新增開課」區塊，內含「新增開課」按鈕

#### Scenario: 點擊新增開課按鈕
- **WHEN** 使用者點擊「新增開課」按鈕
- **THEN** 系統開啟 CourseSessionDialog 合併表單
