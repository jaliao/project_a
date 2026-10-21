## MODIFIED Requirements

### Requirement: 各教會各冊開課學員成長分析頁面

後台 SHALL 提供獨立分析頁面 `/admin/analytics/church-course-growth`，供管理者（`admin`／`superadmin`）依「冊別」與「年度」檢視各教會開課學員的成長趨勢。

頁面 SHALL 提供兩個篩選條件：
1. **冊別**：清單取自全部 `CourseCatalog`（不限 `isActive`），依 `sortOrder` 排序；未指定時預設第一筆。
2. **年度**：清單自「最早一筆 `InviteEnrollment.joinedAt` 所在年度（Asia/Taipei）」至「今年」，由新到舊；未指定或指定值超出可選範圍時，預設為今年（今年不在可選範圍內時，退回最新可選年度）。

篩選條件變更 SHALL 以查詢參數（`year`、`catalogId`）反映於網址，切換篩選 SHALL 導航至帶有新參數的同一頁面。

單次頁面請求 SHALL 只查詢一次「可選年度清單」（頁面已查得的年度清單 SHALL 直接傳入成長資料查詢函式重用，不再重複查詢資料庫）。

#### Scenario: 預設顯示今年與第一筆冊別

- **WHEN** 管理者未帶任何查詢參數開啟此頁面
- **THEN** 頁面顯示依 `sortOrder` 排序後的第一個冊別、今年度（Asia/Taipei）的成長資料

#### Scenario: 切換冊別或年度更新網址與內容

- **WHEN** 管理者於下拉選單切換冊別或年度
- **THEN** 頁面導航至帶有對應 `catalogId`／`year` 查詢參數的網址，並顯示該冊別、該年度的成長資料

#### Scenario: 年度參數超出可選範圍時退回最新可選年度

- **WHEN** 查詢參數 `year` 不合法或超出「最早報名年度至今年」的可選範圍
- **THEN** 頁面以最新可選年度顯示資料，不顯示錯誤

#### Scenario: 單次請求不重複查詢可選年度清單

- **WHEN** 管理者開啟此頁面
- **THEN** 本次請求對「可選年度清單」（`InviteEnrollment` 的 `MIN(joinedAt)` 聚合）僅查詢一次，不因頁面與成長資料查詢函式各自呼叫而查兩次
