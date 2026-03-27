## ADDED Requirements

### Requirement: 講師待審申請清單
課程詳情頁 SHALL 在講師視圖顯示所有 `status=pending` 的 InviteEnrollment 學員，包含姓名、Email、書籍選擇，並提供「同意」按鈕。

#### Scenario: 有待審申請
- **WHEN** 課程有至少一筆 status=pending 的 InviteEnrollment
- **THEN** 頁面顯示待審區塊，列出每位學員的姓名、Email、materialChoice，以及「同意」按鈕

#### Scenario: 無待審申請
- **WHEN** 課程無任何 status=pending 記錄
- **THEN** 不顯示待審區塊（或顯示空狀態「目前無待審申請」）

### Requirement: 同意學員申請
講師點擊「同意」SHALL 將對應 InviteEnrollment.status 從 `pending` 改為 `approved`，並刷新頁面。

#### Scenario: 同意成功
- **WHEN** 講師點擊某學員的「同意」按鈕
- **THEN** 系統更新 InviteEnrollment.status = approved，顯示「已同意申請」toast，該學員從待審區移至已核准清單

#### Scenario: 同意失敗
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示「操作失敗，請稍後再試」toast
