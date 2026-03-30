## MODIFIED Requirements

### Requirement: 課程詳情頁「開始上課」按鈕
課程詳情頁講師操作區 SHALL 在課程為招生中且教材已收件時顯示「開始上課」按鈕，點擊後呼叫 `startCourseSession`。

#### Scenario: 已收件且招生中 — 顯示開始上課按鈕
- **WHEN** 課程 `startedAt = null`、`cancelledAt = null`、`completedAt = null`，且 `CourseOrder.receivedAt != null`
- **THEN** 顯示「開始上課」按鈕

#### Scenario: 尚未申請教材 — 隱藏開始上課按鈕並提示
- **WHEN** `CourseInvite.courseOrderId == null`（尚未申請教材）
- **THEN** 不顯示「開始上課」按鈕，顯示「請先申請教材」提示文字

#### Scenario: 已申請但尚未收件 — 隱藏開始上課按鈕
- **WHEN** `CourseOrder` 存在但 `receivedAt == null`
- **THEN** 不顯示「開始上課」按鈕

#### Scenario: 進行中不顯示開始上課按鈕
- **WHEN** 課程 `startedAt != null`
- **THEN** 不顯示「開始上課」按鈕

#### Scenario: 點擊開始上課成功
- **WHEN** 講師點擊「開始上課」並確認
- **THEN** 課程狀態變為進行中，頁面刷新，toast 顯示「課程已開始」
