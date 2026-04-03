## ADDED Requirements

### Requirement: Topbar 顯示回首頁按鈕
Topbar SHALL 顯示「回首頁」按鈕，點擊後導向目前使用者的學員頁面 `/user/{spiritId}`。

#### Scenario: 點擊回首頁按鈕
- **WHEN** 使用者在任意頁面點擊 Topbar 的「回首頁」按鈕
- **THEN** 導向 `/user/{spiritId.toLowerCase()}`

### Requirement: Topbar 依角色顯示後台管理按鈕
Topbar SHALL 僅對 `role = admin` 或 `role = superadmin` 的使用者顯示「後台管理」按鈕，點擊後導向 `/admin`。

#### Scenario: admin 使用者看到後台管理按鈕
- **WHEN** role 為 admin 或 superadmin 的使用者載入任意頁面
- **THEN** Topbar 顯示「後台管理」按鈕

#### Scenario: 一般使用者看不到後台管理按鈕
- **WHEN** role 為 user 的使用者載入任意頁面
- **THEN** Topbar 不顯示「後台管理」按鈕

#### Scenario: 點擊後台管理按鈕
- **WHEN** admin 使用者點擊「後台管理」按鈕
- **THEN** 導向 `/admin`

### Requirement: Layout 傳遞 role 與 spiritId 給 Topbar
`app/(user)/layout.tsx` SHALL 從 session 取得 `role` 與 `spiritId` 並傳入 `Topbar` 元件。

#### Scenario: layout 傳遞 session 資料
- **WHEN** 已登入使用者進入任意 `(user)` 路由群組頁面
- **THEN** Topbar 收到正確的 role 與 spiritId
