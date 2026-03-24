## ADDED Requirements

### Requirement: 課程卡片元件
系統 SHALL 提供共用 `CourseSessionCard` 元件，接受課程資料 props 並以卡片方式呈現，供 Dashboard 與開課查詢頁共用。

#### Scenario: 顯示基本課程資訊
- **WHEN** 元件收到 title、courseLevel、maxCount、enrolledCount
- **THEN** 卡片顯示課程名稱、課程等級標籤、已報名人數 / 預計人數

#### Scenario: 顯示開課日期
- **WHEN** courseDate 有值
- **THEN** 卡片顯示「預計開課：{courseDate}」
- **WHEN** courseDate 為 null
- **THEN** 卡片不顯示開課日期列

#### Scenario: 顯示邀請截止日期
- **WHEN** expiredAt 有值
- **THEN** 卡片顯示「截止報名：{格式化日期}」
- **WHEN** expiredAt 為 null
- **THEN** 卡片不顯示截止日期列

### Requirement: 課程卡片 variant 樣式
元件 SHALL 支援 `variant` prop（`'compact'` 或 `'full'`），預設 `'compact'`。

#### Scenario: compact variant
- **WHEN** variant 為 compact 或未指定
- **THEN** 卡片使用較精簡的樣式（適合 Dashboard 多卡片並排）

#### Scenario: full variant
- **WHEN** variant 為 full
- **THEN** 卡片使用較完整的樣式（適合查詢頁單欄列表）
