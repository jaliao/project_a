## ADDED Requirements

### Requirement: 結業紀錄區塊
學習紀錄頁面 SHALL 新增「結業紀錄」區塊，顯示學員所有 `InviteEnrollment.graduatedAt` 不為 null 的記錄，每筆包含：課程名稱、課程等級、授課教師姓名、結業日期。

#### Scenario: 有結業紀錄的使用者
- **WHEN** 擁有 graduatedAt 記錄的使用者進入 /learning
- **THEN** 「結業紀錄」區塊顯示所有結業課程，依 graduatedAt 降冪排列

#### Scenario: 無結業紀錄時顯示空狀態
- **WHEN** 使用者尚無任何 graduatedAt 記錄
- **THEN** 「結業紀錄」區塊顯示空狀態提示「尚無結業紀錄」
