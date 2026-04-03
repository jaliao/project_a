## ADDED Requirements

### Requirement: 系統設定新增課程目錄管理分頁
`/admin/settings` Tabs SHALL 新增「課程目錄管理」第三個分頁（`?tab=courses`）。
分頁 SHALL 顯示 `CourseCatalogTable` 元件（含現有 CRUD 功能）。
admin 與 superadmin 皆 SHALL 可操作。

#### Scenario: 管理者查看課程目錄管理
- **WHEN** admin 或 superadmin 點擊「課程目錄管理」分頁，或訪問 `/admin/settings?tab=courses`
- **THEN** 顯示課程目錄管理表格（CourseCatalogTable）

### Requirement: /admin/course-catalog redirect 相容
`/admin/course-catalog` SHALL 保留為 server-side redirect，導向 `/admin/settings?tab=courses`。
`app/actions/course-catalog.ts` 的 `revalidatePath('/admin/course-catalog')` SHALL 更新為 `/admin/settings`。

#### Scenario: 舊連結相容
- **WHEN** 使用者或系統訪問 `/admin/course-catalog`
- **THEN** 系統 redirect 至 `/admin/settings?tab=courses`

### Requirement: 後台首頁移除課程管理卡片
後台首頁 `/admin` SHALL 移除「課程管理」功能卡片。
課程目錄管理入口統一透過「系統設定」進入。

#### Scenario: 後台首頁不顯示課程管理卡片
- **WHEN** 管理者進入後台首頁 `/admin`
- **THEN** 功能卡片中不包含「課程管理」卡片
