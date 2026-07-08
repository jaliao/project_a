# course-session-card Delta Specification

## MODIFIED Requirements

### Requirement: 課程卡片元件
系統 SHALL 提供共用 `CourseSessionCard` 元件，接受課程資料 props 並以卡片方式呈現，供 Dashboard 與開課查詢頁共用。卡片 SHALL 接受可選的 `href` prop，當 `href` 有值時整張卡片為可點擊連結。
卡片標題區 SHALL 為垂直堆疊：課程標籤列（公開招生／等級／狀態）位於課程標題**上方**，標題獨占一行、不因標籤佔位而折行（過長時自然換行完整顯示）。

#### Scenario: 顯示基本課程資訊
- **WHEN** 元件收到 title、courseLevel、maxCount、enrolledCount
- **THEN** 卡片顯示課程名稱、課程等級標籤、已報名人數 / 預計人數

#### Scenario: 標籤列於標題上方、標題不折行
- **WHEN** 卡片於手機視窗顯示且標題較長
- **THEN** 標籤列顯示於標題上方，標題獨占整行自然換行，不與標籤同列擠壓

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

#### Scenario: 卡片含連結（href 有值）
- **WHEN** href prop 傳入有效路徑（如 `/course/123`）
- **THEN** 整張卡片包裹於 Next.js Link 元件，點擊導向對應課程詳情頁

#### Scenario: 卡片不含連結（href 未傳）
- **WHEN** href prop 未傳入或為 undefined
- **THEN** 卡片維持純展示，不可點擊導航
