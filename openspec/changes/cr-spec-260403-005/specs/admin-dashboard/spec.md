## ADDED Requirements

### Requirement: 後台儀錶板頁面
系統 SHALL 提供 `/admin/dashboard` 頁面，供 admin/superadmin 查看系統整體統計。
role 為 `user` 者 SHALL redirect 至 `/`。

#### Scenario: 管理者進入儀錶板
- **WHEN** admin 或 superadmin 訪問 `/admin/dashboard`
- **THEN** 頁面顯示統計卡片與圖表

#### Scenario: 一般使用者被拒絕
- **WHEN** role 為 `user` 的使用者訪問 `/admin/dashboard`
- **THEN** 系統 redirect 至 `/`

### Requirement: 統計數據卡片
頁面 SHALL 顯示以下四個統計卡片：
1. **總學員數**：系統中所有 User 總數
2. **啟動靈人資格講師數**：至少具備一筆 CourseCatalog id=1 結業紀錄（`graduatedAt IS NOT NULL`）的不重複使用者數
3. **啟動豐盛資格講師數**：至少具備一筆 CourseCatalog id=2 結業紀錄的不重複使用者數
4. **進行中課程總數**：`startedAt IS NOT NULL AND cancelledAt IS NULL AND completedAt IS NULL` 的 CourseInvite 數

#### Scenario: 統計卡片顯示正確數值
- **WHEN** 管理者進入儀錶板
- **THEN** 四個卡片分別顯示對應的最新計算數值

### Requirement: 上課人次趨勢圖表
頁面 SHALL 顯示「上課人次」BarChart，呈現指定時間區間內各課程類別的上課人次（`CourseInvite.startedAt` 落在區間內的開課筆數）。
X 軸 SHALL 為課程類別名稱（CourseCatalog label），Y 軸 SHALL 為人次數量。
圖表標題 SHALL 顯示「上課人次（依課程類別）」。

#### Scenario: 上課人次圖表依時間區間篩選
- **WHEN** 管理者選擇「30天內」
- **THEN** 圖表顯示過去 30 天內各課程類別的 startedAt 計數

### Requirement: 順利結業趨勢圖表
頁面 SHALL 顯示「順利結業」BarChart，呈現指定時間區間內各課程類別的結業人數（`InviteEnrollment.graduatedAt` 落在區間內）。
X 軸 SHALL 為課程類別名稱，Y 軸 SHALL 為結業人數。

#### Scenario: 結業圖表依時間區間篩選
- **WHEN** 管理者選擇「7天內」
- **THEN** 圖表顯示過去 7 天內各課程類別的 graduatedAt 計數

### Requirement: 時間區間切換
頁面 SHALL 提供三個時間區間選項：**3個月內**（90天）、**30天內**、**7天內**，預設為 **30天內**。
切換以 URL `?range=` 參數控制（`3m` / `30d` / `7d`），兩個圖表 SHALL 使用同一個時間區間。

#### Scenario: 切換時間區間
- **WHEN** 管理者點擊「3個月內」
- **THEN** URL 更新為 `?range=3m`，兩個圖表同步更新為 90 天內的資料

### Requirement: 後台首頁儀錶板卡片啟用
後台首頁 `/admin` 的「儀錶板」功能卡片 SHALL 連結至 `/admin/dashboard`，並移除「待開發」badge。

#### Scenario: 點擊儀錶板卡片
- **WHEN** 管理者點擊後台首頁「儀錶板」卡片
- **THEN** 導向 `/admin/dashboard`
