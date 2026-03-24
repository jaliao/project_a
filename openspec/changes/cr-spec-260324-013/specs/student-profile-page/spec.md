## ADDED Requirements

### Requirement: 學員專屬頁面路由
系統 SHALL 提供 `/user/{spiritId}` 路由，顯示指定學員的個人資料頁面。所有已登入使用者皆可存取任意學員頁面。路由參數使用 Spirit ID（例：`PA260001`），不使用 UUID。

#### Scenario: 已登入使用者查閱他人頁面
- **WHEN** 已登入使用者存取 `/user/{otherSpiritId}`
- **THEN** 系統顯示對應學員的基本資料頁面

#### Scenario: 使用者查閱自己的頁面
- **WHEN** 已登入使用者存取 `/user/{selfSpiritId}`
- **THEN** 系統顯示自己的基本資料頁面，內容與他人檢視相同

#### Scenario: 未登入使用者存取
- **WHEN** 未登入使用者存取 `/user/{spiritId}`
- **THEN** 系統重定向至 `/login?callbackUrl=/user/{spiritId}`

#### Scenario: 不存在的 Spirit ID
- **WHEN** 已登入使用者存取不存在的 Spirit ID
- **THEN** 系統顯示 404 頁面

### Requirement: 基本資料單元 — 姓名
學員頁面 SHALL 顯示該學員的姓名（realName），若 realName 為空則 fallback 顯示 name。

#### Scenario: 有 realName 的學員
- **WHEN** 使用者查閱 realName 非空的學員頁面
- **THEN** 頁面顯示 realName

#### Scenario: 只有 name 的學員
- **WHEN** 使用者查閱 realName 為空但 name 非空的學員頁面
- **THEN** 頁面顯示 name

### Requirement: 基本資料單元 — 身分標籤
學員頁面 SHALL 依據學員的 learningLevel 顯示對應的身分標籤 Badge。learningLevel 為 0 時不顯示標籤。

#### Scenario: learningLevel 為 1
- **WHEN** 使用者查閱 learningLevel = 1 的學員頁面
- **THEN** 頁面顯示「啟動靈人 1 學員」Badge

#### Scenario: learningLevel 為 2
- **WHEN** 使用者查閱 learningLevel = 2 的學員頁面
- **THEN** 頁面顯示「啟動靈人 2 學員」Badge

#### Scenario: learningLevel 為 3
- **WHEN** 使用者查閱 learningLevel = 3 的學員頁面
- **THEN** 頁面顯示「啟動靈人 3 學員」Badge

#### Scenario: learningLevel 為 4
- **WHEN** 使用者查閱 learningLevel = 4 的學員頁面
- **THEN** 頁面顯示「啟動靈人 4 學員」Badge

#### Scenario: learningLevel 為 0
- **WHEN** 使用者查閱 learningLevel = 0 的學員頁面
- **THEN** 頁面不顯示任何身分標籤

### Requirement: 基本資料單元 — 已完成課程
學員頁面 SHALL 顯示該學員已加入的課程清單（透過 InviteEnrollment 關聯取得），列出課程名稱。若無任何已完成課程則顯示空狀態提示。

#### Scenario: 有已完成課程的學員
- **WHEN** 使用者查閱有 InviteEnrollment 記錄的學員頁面
- **THEN** 頁面顯示每筆 InviteEnrollment 對應的課程名稱（依 courseLevel config 取得 label）

#### Scenario: 無已完成課程的學員
- **WHEN** 使用者查閱無任何 InviteEnrollment 的學員頁面
- **THEN** 已完成課程區塊顯示空狀態提示文字「尚未完成任何課程」
