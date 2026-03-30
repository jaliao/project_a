## MODIFIED Requirements

### Requirement: 身分標籤顯示
學員頁面基本資料區塊 SHALL 顯示身分標籤，支援多個 Badge 並排顯示。標籤來源為 `role`（系統管理員）與結業證書（啟動靈人 N 講師），標籤順序為角色標籤優先，講師標籤依等級升序排列。

#### Scenario: 管理員且有講師資格
- **WHEN** 使用者 role 為 admin 且有 level1 結業證書
- **THEN** 基本資料顯示「系統管理員」與「啟動靈人 1 講師」兩個 Badge

#### Scenario: 僅有講師資格
- **WHEN** 使用者 role 為 user 且有 level1 結業證書
- **THEN** 基本資料僅顯示「啟動靈人 1 講師」Badge

#### Scenario: 無任何資格
- **WHEN** 使用者 role 為 user 且無任何結業證書
- **THEN** 身分標籤欄位顯示「—」
