## ADDED Requirements

### Requirement: Admin 可檢視課程目錄列表
管理員（role 為 `admin` 或 `superadmin`）SHALL 能在後台頁面 `/admin/course-catalog` 檢視所有課程的名稱、isActive 狀態與先修課程設定。

#### Scenario: Admin 開啟課程目錄管理頁面
- **WHEN** role 為 `admin` 或 `superadmin` 的使用者造訪 `/admin/course-catalog`
- **THEN** 頁面顯示所有課程列表，每筆包含課程名稱、isActive 狀態、先修課程名稱

#### Scenario: 非 Admin 無法存取課程目錄管理頁面
- **WHEN** role 為 `user` 的使用者造訪 `/admin/course-catalog`
- **THEN** 系統拒絕存取（回傳 403 或重導至首頁）

### Requirement: Admin 可編輯課程名稱
管理員 SHALL 能透過編輯表單修改任一課程的顯示名稱（label），儲存後立即生效於所有顯示課程名稱的頁面。

#### Scenario: 成功更新課程名稱
- **WHEN** admin 在編輯表單輸入新名稱並送出
- **THEN** `CourseCatalog.label` 更新為新值，並顯示成功提示

#### Scenario: 課程名稱不可為空
- **WHEN** admin 送出空白課程名稱
- **THEN** 系統拒絕，顯示「課程名稱不可為空」錯誤訊息

### Requirement: Admin 可切換課程 isActive 狀態
管理員 SHALL 能切換任一課程的 `isActive` 開關，控制該課程是否可被選擇開課。

#### Scenario: 將課程設為開放
- **WHEN** admin 將某課程的 isActive 切換為 true 並儲存
- **THEN** `CourseCatalog.isActive` 更新為 true，該課程出現於開課選單

#### Scenario: 將課程設為關閉
- **WHEN** admin 將某課程的 isActive 切換為 false 並儲存
- **THEN** `CourseCatalog.isActive` 更新為 false，該課程從開課選單移除

### Requirement: Admin 可設定課程的先修課程（多選）
管理員 SHALL 能為任一課程勾選零個或多個其他課程作為先修條件，儲存後即生效於先修驗證。

#### Scenario: 設定多個先修課程
- **WHEN** admin 為某課程勾選兩個先修課程並儲存
- **THEN** 該課程的先修關聯更新為所勾選的課程集合

#### Scenario: 清除所有先修條件
- **WHEN** admin 取消勾選所有先修課程並儲存
- **THEN** 該課程的先修關聯清空，任何人皆可報名

#### Scenario: 課程不可設定自身為先修
- **WHEN** admin 嘗試將課程 A 的先修設為課程 A 本身
- **THEN** 系統不顯示或不允許選擇自身作為先修選項
