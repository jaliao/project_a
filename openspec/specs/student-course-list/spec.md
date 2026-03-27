## ADDED Requirements

### Requirement: 學員課程三狀態分組顯示
學員專屬頁面 SHALL 將該學員的所有 enrollments 依課程狀態分為三個區塊顯示：**申請中**、**已開課**、**已結業**。已取消課程的 enrollment SHALL 不顯示。

#### Scenario: 申請中分組顯示 pending enrollments
- **WHEN** 學員有 `status = 'pending'` 且對應課程未取消的 enrollment
- **THEN** 該課程顯示在「申請中」區塊

#### Scenario: 已開課分組顯示 approved 且課程未結業
- **WHEN** 學員有 `status = 'approved'`、`completedAt = null`、`cancelledAt = null` 的 enrollment
- **THEN** 該課程顯示在「已開課」區塊

#### Scenario: 已結業分組顯示 approved 且課程已結業
- **WHEN** 學員有 `status = 'approved'` 且對應課程 `completedAt != null` 的 enrollment
- **THEN** 該課程顯示在「已結業」區塊

#### Scenario: 已取消課程不顯示
- **WHEN** 學員的 enrollment 對應課程 `cancelledAt != null`
- **THEN** 該 enrollment 不顯示在任何分組

### Requirement: 課程以卡片元件呈現
各分組 SHALL 使用 `CourseSessionCard`（`compact` variant）呈現每個課程，卡片 `href` 指向 `/course/[id]`。

#### Scenario: 卡片顯示課程資訊
- **WHEN** 課程列在任一分組中
- **THEN** 使用 `CourseSessionCard` 顯示課程名稱、課程等級、開課日期（若有）、報名人數

#### Scenario: 卡片連結到課程詳情
- **WHEN** 學員點擊卡片
- **THEN** 導向 `/course/[inviteId]`

### Requirement: 空分組顯示提示文字
各分組若無課程 SHALL 顯示提示文字，不顯示空白區塊。

#### Scenario: 申請中無資料
- **WHEN** 學員沒有申請中的課程
- **THEN** 「申請中」區塊顯示「目前沒有申請中的課程」

#### Scenario: 已開課無資料
- **WHEN** 學員沒有已開課的課程
- **THEN** 「已開課」區塊顯示「目前沒有進行中的課程」

#### Scenario: 已結業無資料
- **WHEN** 學員沒有已結業的課程
- **THEN** 「已結業」區塊顯示「尚無結業課程」

### Requirement: getMyEnrollments data layer 查詢
系統 SHALL 提供 `getMyEnrollments(userId)` 函數，查詢該學員的所有 enrollments，回傳包含 invite 的 `completedAt`、`cancelledAt`、`courseDate` 等狀態欄位，供頁面進行分組。

#### Scenario: 查詢回傳完整狀態欄位
- **WHEN** 呼叫 `getMyEnrollments(userId)`
- **THEN** 回傳陣列中每筆包含 `status`、`inviteId`、`completedAt`、`cancelledAt`、`courseDate`、`enrolledCount`
