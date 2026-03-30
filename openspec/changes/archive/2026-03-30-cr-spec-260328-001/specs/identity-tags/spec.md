## ADDED Requirements

### Requirement: 身分標籤計算邏輯
系統 SHALL 根據使用者的 `role` 與結業證書計算身分標籤陣列，可同時包含多個標籤。

#### Scenario: 系統管理員標籤
- **WHEN** 使用者 `role` 為 `admin` 或 `superadmin`
- **THEN** 標籤陣列包含「系統管理員」

#### Scenario: 一般使用者不顯示管理員標籤
- **WHEN** 使用者 `role` 為 `user`
- **THEN** 標籤陣列不包含「系統管理員」

### Requirement: 啟動靈人講師標籤
系統 SHALL 根據使用者的結業證書產生對應等級的「啟動靈人 N 講師」標籤。

#### Scenario: 擁有啟動靈人 1 結業證書
- **WHEN** 使用者有 `courseLevel = level1` 且 `graduatedAt` 不為 null 的 InviteEnrollment
- **THEN** 標籤陣列包含「啟動靈人 1 講師」

#### Scenario: 擁有多個等級結業證書
- **WHEN** 使用者分別有 level1 與 level2 的結業證書
- **THEN** 標籤陣列同時包含「啟動靈人 1 講師」與「啟動靈人 2 講師」

#### Scenario: 無結業證書
- **WHEN** 使用者沒有任何 graduatedAt 有值的 InviteEnrollment
- **THEN** 標籤陣列不包含任何講師標籤

### Requirement: 無任何標籤時顯示佔位符
若標籤陣列為空，系統 SHALL 顯示「—」佔位符。

#### Scenario: 無標籤使用者
- **WHEN** 使用者 role 為 user 且無任何結業證書
- **THEN** 身分標籤區塊顯示「—」
