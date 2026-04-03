## ADDED Requirements

### Requirement: 系統設定頁 Tabs 佈局
`/admin/settings` SHALL 以 Tabs 元件呈現兩個分頁：「基本設定」與「教會代碼維護」。
進入頁面時 SHALL 預設顯示「基本設定」分頁（`?tab=basic` 或無 tab 參數）。
admin 與 superadmin 角色 SHALL 皆可進入 `/admin/settings`；role 為 `user` 者 SHALL redirect 至 `/`。

#### Scenario: 管理者進入系統設定
- **WHEN** admin 或 superadmin 訪問 `/admin/settings`
- **THEN** 頁面顯示 Tabs，預設 active tab 為「基本設定」

#### Scenario: 一般使用者被拒絕
- **WHEN** role 為 `user` 的使用者訪問 `/admin/settings`
- **THEN** 系統 redirect 至 `/`

### Requirement: 基本設定分頁
「基本設定」分頁 SHALL 顯示學習階層展開深度設定表單（`HierarchyDepthForm`）。
此設定 SHALL 僅 superadmin 可操作；admin 進入「基本設定」分頁時 SHALL 看不到此表單（或顯示無權限提示）。

#### Scenario: superadmin 查看基本設定
- **WHEN** superadmin 訪問 `/admin/settings`（或 `?tab=basic`）
- **THEN** 顯示「學習階層展開深度」設定表單

#### Scenario: admin 查看基本設定
- **WHEN** admin 訪問 `/admin/settings`（或 `?tab=basic`）
- **THEN** 基本設定分頁顯示「此設定需 superadmin 權限」提示，不顯示表單

### Requirement: 教會代碼維護分頁
「教會代碼維護」分頁 SHALL 顯示 `ChurchList` 元件（原 `/admin/churches` 的內容）。
admin 與 superadmin 皆 SHALL 可操作。分頁標題 SHALL 顯示「教會代碼維護」。

#### Scenario: 管理者查看教會代碼維護
- **WHEN** admin 或 superadmin 點擊「教會代碼維護」分頁，或訪問 `/admin/settings?tab=churches`
- **THEN** 顯示教會清單，可進行 CRUD 操作

### Requirement: URL 參數導航
Tab 切換 SHALL 透過 URL `?tab=` 參數控制，使瀏覽器歷史可回退。
有效值 SHALL 為 `basic`（預設）與 `churches`。

#### Scenario: 直接導航至教會分頁
- **WHEN** 使用者訪問 `/admin/settings?tab=churches`
- **THEN** 頁面直接顯示「教會代碼維護」分頁為 active

### Requirement: /admin/churches redirect 相容
`/admin/churches` SHALL 保留為 server-side redirect，導向 `/admin/settings?tab=churches`。
`app/actions/church.ts` 的 `revalidatePath` SHALL 更新為 `/admin/settings`。

#### Scenario: 舊連結相容
- **WHEN** 使用者或系統訪問 `/admin/churches`
- **THEN** 系統 redirect 至 `/admin/settings?tab=churches`

### Requirement: 後台首頁功能卡片連結更新
後台首頁 `/admin` 的「教會管理」功能卡片連結 SHALL 更新為 `/admin/settings?tab=churches`。

#### Scenario: 後台首頁點擊教會管理
- **WHEN** 管理者點擊後台首頁「教會管理」卡片
- **THEN** 導向 `/admin/settings?tab=churches`
