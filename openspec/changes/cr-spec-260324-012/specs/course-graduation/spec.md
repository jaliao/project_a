## ADDED Requirements

### Requirement: 講師結業操作
課程詳情頁 SHALL 在講師視圖顯示「結業」按鈕，僅在課程未取消且未結業時顯示。點擊後需確認，確認後寫入 `CourseInvite.completedAt`。

#### Scenario: 結業按鈕可見條件
- **WHEN** 使用者為講師且課程 cancelledAt 為 null 且 completedAt 為 null
- **THEN** 顯示「結業」按鈕

#### Scenario: 點擊結業彈出確認
- **WHEN** 講師點擊「結業」
- **THEN** 彈出確認 Dialog，標題「確認結業」，說明此操作不可還原

#### Scenario: 確認結業成功
- **WHEN** 講師確認送出
- **THEN** 系統寫入 CourseInvite.completedAt = now()，顯示「課程已結業」toast，頁面刷新顯示「已結業」標籤

#### Scenario: 課程已結業時隱藏按鈕
- **WHEN** CourseInvite.completedAt 不為 null
- **THEN** 不顯示「結業」按鈕，頁面顯示「已結業」狀態標籤

### Requirement: 結業資料模型
`CourseInvite` SHALL 包含 `completedAt DateTime?` 欄位，有值即代表已結業。

#### Scenario: 結業時間記錄
- **WHEN** 結業操作成功執行
- **THEN** CourseInvite.completedAt 儲存結業時間戳
