## ADDED Requirements

### Requirement: 個人頁學習紀錄區塊嵌入最近提問
學員個人頁「學習紀錄」區塊 SHALL 顯示本人最近 3 筆「聯繫管理者」提問（`SupportInquiry`，依提問時間倒序），每筆顯示分類、內容摘要、狀態（待處理／已回覆）；區塊下方 SHALL 提供「看更多」按鈕，導向 `/user/{spiritId}/inquiries` 頁面檢視完整清單。此區塊 SHALL 僅於本人瀏覽自己的個人頁時顯示。

#### Scenario: 顯示最近 3 筆提問
- **WHEN** 學員瀏覽自己的個人頁「學習紀錄」區塊，且已送出 3 筆以上提問
- **THEN** 區塊僅顯示依提問時間倒序排列的最近 3 筆，每筆含分類、內容摘要與狀態

#### Scenario: 提問筆數不足 3 筆
- **WHEN** 學員送出的提問少於 3 筆
- **THEN** 區塊顯示其現有的全部提問（不足 3 筆亦不補空白項）

#### Scenario: 尚無提問時的空狀態
- **WHEN** 學員尚未送出過任何提問
- **THEN** 區塊顯示空狀態提示，仍顯示「看更多」按鈕導向 `/user/{spiritId}/inquiries`

#### Scenario: 點擊看更多
- **WHEN** 學員點擊「看更多」按鈕
- **THEN** 系統導向 `/user/{spiritId}/inquiries` 頁面，可檢視完整提問清單與送出新提問

#### Scenario: 不公開給其他會員
- **WHEN** 其他會員瀏覽該學員的公開個人頁
- **THEN** 不顯示「學習紀錄」最近提問區塊
