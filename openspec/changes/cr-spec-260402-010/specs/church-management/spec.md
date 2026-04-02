## ADDED Requirements

### Requirement: 教會清單 CRUD 管理
系統 SHALL 提供 `/admin/churches` 後台頁面，讓 admin/superadmin 管理教會/單位清單。頁面顯示所有教會（含停用），支援新增、編輯名稱與排序、啟用/停用。

#### Scenario: 顯示教會清單
- **WHEN** 管理者進入 `/admin/churches`
- **THEN** 頁面顯示所有教會，依 `sortOrder ASC, id ASC` 排序，每筆顯示：名稱、狀態（啟用/停用）、會員數、操作按鈕

#### Scenario: 新增教會
- **WHEN** 管理者填寫名稱並送出新增表單
- **THEN** 系統建立新教會（`isActive = true`，`sortOrder` 預設為現有最大值 +1），重新整理清單

#### Scenario: 新增名稱為空
- **WHEN** 管理者送出空白名稱
- **THEN** 顯示驗證錯誤「名稱不可為空」，不建立資料

#### Scenario: 編輯教會名稱與排序
- **WHEN** 管理者修改名稱或 sortOrder 並儲存
- **THEN** 系統更新對應欄位，清單重新整理

#### Scenario: 停用教會
- **WHEN** 管理者切換教會為停用
- **THEN** 教會 `isActive` 設為 false，該教會不再出現於會員選擇下拉清單，但已關聯會員資料保留

#### Scenario: 啟用教會
- **WHEN** 管理者將停用教會切換為啟用
- **THEN** 教會 `isActive` 設為 true，重新出現於會員選擇下拉清單

#### Scenario: 刪除有關聯會員的教會
- **WHEN** 管理者嘗試刪除仍有會員關聯（`churchType = 'church'`）的教會
- **THEN** 系統拒絕刪除並顯示錯誤「尚有 N 位會員關聯此教會，無法刪除」

#### Scenario: 刪除無關聯教會
- **WHEN** 管理者刪除無任何會員關聯的教會
- **THEN** 系統刪除該教會，清單重新整理

#### Scenario: 非管理者存取
- **WHEN** role 為 `user` 的使用者訪問 `/admin/churches`
- **THEN** 重新導向至 `/`

### Requirement: 後台首頁新增教會管理入口
後台首頁 `/admin` 功能導覽卡片 SHALL 新增「教會管理」入口，連結至 `/admin/churches`。

#### Scenario: 顯示教會管理卡片
- **WHEN** admin/superadmin 進入 `/admin`
- **THEN** 功能卡片中包含「教會管理」，可點擊導航至 `/admin/churches`
