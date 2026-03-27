## ADDED Requirements

### Requirement: 結業證明卡片
系統 SHALL 提供結業證明卡片元件，顯示課程等級名稱、授課教師姓名及結業日期。

#### Scenario: 顯示結業證明卡片
- **WHEN** 學員擁有 `InviteEnrollment.graduatedAt` 不為 null 的記錄
- **THEN** 系統顯示對應課程等級的結業證明卡片，內含：課程名稱、授課教師姓名、結業日期

### Requirement: 每個課程等級只顯示一張結業證明
同一課程等級（courseLevel）無論學員參加過幾次，系統 SHALL 只顯示一張結業證明，取該等級最新的 `graduatedAt` 記錄。

#### Scenario: 同等級參加多次
- **WHEN** 學員在同一 courseLevel 的不同課程中均獲得結業證明
- **THEN** 學員頁面只顯示一張該等級的結業證明卡片（最新一筆）

#### Scenario: 不同等級各顯示一張
- **WHEN** 學員擁有 level1 與 level2 的結業證明
- **THEN** 學員頁面顯示兩張不同等級的結業證明卡片

### Requirement: 學員頁面顯示結業證明
學員頁面（`/user/[spiritId]`）SHALL 在基本資料區塊下方顯示該學員擁有的結業證明卡片列表。

#### Scenario: 有結業證明的學員
- **WHEN** 存取有結業證明的學員頁面
- **THEN** 頁面顯示「結業證明」區塊，列出所有等級的結業證明卡片

#### Scenario: 無結業證明的學員
- **WHEN** 存取無結業紀錄的學員頁面
- **THEN** 不顯示「結業證明」區塊，或顯示空狀態提示
