## MODIFIED Requirements

### Requirement: 首頁顯示「新增開課」區塊
首頁 SHALL 在「已新增的開課」預覽卡片列表下方保留「授課」功能卡片，包含「新增開課」按鈕與「開課查詢」Link（導向 `/course-sessions`）。

#### Scenario: 進入首頁
- **WHEN** 已登入使用者進入 `/dashboard`
- **THEN** 頁面先顯示「已新增的開課」預覽列表（有記錄時），接著顯示「授課」功能卡片

#### Scenario: 點擊新增開課按鈕
- **WHEN** 使用者點擊「新增開課」按鈕
- **THEN** 系統開啟 CourseSessionDialog 合併表單

#### Scenario: 點擊開課查詢
- **WHEN** 使用者點擊「開課查詢」
- **THEN** 系統導向 `/course-sessions`
