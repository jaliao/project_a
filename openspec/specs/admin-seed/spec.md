## ADDED Requirements

### Requirement: 後台首頁功能導覽按鈕
`/admin` 首頁 SHALL 以功能按鈕網格呈現所有管理功能入口，取代原有的統計與資料預覽區塊。

#### Scenario: 管理者進入後台首頁
- **WHEN** admin/superadmin 進入 `/admin`
- **THEN** 顯示功能按鈕網格，包含：儀錶板（disabled）、課程管理（`/admin/course-catalog`）、授課管理（`/course-sessions`）、教材作業（`/admin/materials`）、會員管理（`/admin/members`）

#### Scenario: 儀錶板按鈕為待開發狀態
- **WHEN** 管理者看到「儀錶板」功能按鈕
- **THEN** 按鈕顯示為不可點擊（disabled）並標示「待開發」
