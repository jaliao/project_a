## ADDED Requirements

### Requirement: 後台開課管理頁
系統 SHALL 提供 `/admin/course-sessions` 頁面，供 admin/superadmin 查看全站所有開課記錄。
頁面標題 SHALL 顯示「開課管理」。role 為 `user` 者 SHALL redirect 至 `/`。

#### Scenario: 管理者進入開課管理
- **WHEN** admin 或 superadmin 訪問 `/admin/course-sessions`
- **THEN** 頁面顯示「開課管理」標題與開課列表

#### Scenario: 一般使用者被拒絕
- **WHEN** role 為 `user` 的使用者訪問 `/admin/course-sessions`
- **THEN** 系統 redirect 至 `/`

### Requirement: 總筆數與資料上限
頁面 SHALL 顯示符合目前篩選條件的開課總筆數。
列表 SHALL 預設僅顯示最新 30 筆，按開課日期（courseDate）降序排列，courseDate 為 null 者排在最後。

#### Scenario: 顯示總筆數
- **WHEN** 管理者進入頁面
- **THEN** 頁面顯示「共 N 筆」（N 為符合篩選的總數），列表最多呈現 30 筆卡片

#### Scenario: 超過 30 筆時的提示
- **WHEN** 符合篩選的總數超過 30 筆
- **THEN** 列表顯示前 30 筆，並在列表下方說明「顯示前 30 筆，請使用搜尋縮小範圍」

### Requirement: 文字搜尋
頁面 SHALL 提供文字搜尋輸入框（`?q=` URL 參數），搜尋範圍涵蓋：
- 課程名稱（`CourseInvite.title`）
- 講師姓名（`createdBy.name` 或 `createdBy.realName`）
- 學員姓名（已加入 enrollment 的 `user.name` 或 `user.realName`）

#### Scenario: 搜尋課程名稱
- **WHEN** 管理者在搜尋框輸入文字並送出
- **THEN** 列表僅顯示課程名稱、講師姓名或學員姓名中包含該文字的開課

#### Scenario: 搜尋結果為空
- **WHEN** 搜尋後無符合結果
- **THEN** 顯示「找不到符合條件的開課記錄」提示

### Requirement: 下拉篩選
頁面 SHALL 提供三組下拉篩選，以 URL 參數傳遞：
- **課程名稱**（`?catalogId=`）：選擇 CourseCatalog label，篩選對應課程的開課
- **進度**（`?status=`）：選項為「招生中 / 進行中 / 已結業 / 已取消」
- **開課日期區間**（`?startDate=`、`?endDate=`）：依 courseDate 欄位篩選

每組篩選 SHALL 有「全部」預設選項。

#### Scenario: 篩選進度
- **WHEN** 管理者從「進度」下拉選擇「進行中」
- **THEN** 列表僅顯示 startedAt IS NOT NULL 且 cancelledAt IS NULL 且 completedAt IS NULL 的開課

#### Scenario: 篩選日期區間
- **WHEN** 管理者設定開始日期與結束日期
- **THEN** 列表僅顯示 courseDate 在該區間內的開課

#### Scenario: 重設篩選
- **WHEN** 管理者清除所有篩選條件
- **THEN** 列表恢復顯示所有開課（最新 30 筆）

### Requirement: 點擊課程另開視窗
開課列表中每筆卡片 SHALL 在點擊時以新分頁開啟對應的課程詳情頁（`/course/{id}`）。

#### Scenario: 點擊開課卡片
- **WHEN** 管理者點擊任一開課卡片
- **THEN** 瀏覽器以新分頁開啟 `/course/{id}`

### Requirement: 後台首頁連結更新
後台首頁 `/admin` 的「授課管理」功能卡片 SHALL 連結至 `/admin/course-sessions`。

#### Scenario: 點擊授課管理
- **WHEN** 管理者點擊後台首頁「授課管理」卡片
- **THEN** 導向 `/admin/course-sessions`
