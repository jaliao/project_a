## ADDED Requirements

### Requirement: 後台系統設定管理頁
系統 SHALL 提供 `/admin/settings` 頁面，僅 superadmin 角色可訪問。頁面 SHALL 顯示並允許修改 `hierarchy_depth` 設定（學習階層展開深度），有效值範圍為 1–10 整數，預設值為 3。設定值儲存於 `AdminSetting` 資料表（key/value store）。

#### Scenario: 顯示現有設定值
- **WHEN** superadmin 進入 `/admin/settings`
- **THEN** 頁面顯示目前的 `hierarchy_depth` 數值（若尚未設定則顯示預設值 3）

#### Scenario: 修改階層深度
- **WHEN** superadmin 輸入 1–10 之間的整數並送出
- **THEN** 系統更新 `AdminSetting` 中 `hierarchy_depth` 的值，顯示成功訊息

#### Scenario: 輸入無效數值
- **WHEN** superadmin 輸入 0、負數、非整數或大於 10 的值並送出
- **THEN** 系統顯示驗證錯誤訊息，不更新設定

#### Scenario: 非 superadmin 存取
- **WHEN** role 為 `admin` 或 `user` 的使用者訪問 `/admin/settings`
- **THEN** 頁面重新導向至 `/`

### Requirement: AdminSetting 資料模型
系統 SHALL 建立 `AdminSetting` 資料表，欄位包含 `key String @unique` 與 `value String`。讀取時透過 `getAdminSetting(key, defaultValue)` 取得設定值，預設值由呼叫端提供。

#### Scenario: 讀取不存在的設定鍵
- **WHEN** `getAdminSetting('hierarchy_depth', '3')` 被呼叫且資料表中無此鍵
- **THEN** 函式回傳預設值 `'3'`

#### Scenario: 讀取已存在的設定鍵
- **WHEN** `getAdminSetting('hierarchy_depth', '3')` 被呼叫且資料表中有值 `'5'`
- **THEN** 函式回傳 `'5'`
