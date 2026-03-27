## ADDED Requirements

### Requirement: createNotification 內部工具函數
系統 SHALL 提供 `createNotification(userId: string, title: string, body: string)` 函數，供 Server Actions 在操作成功後寫入 Inbox 通知。

#### Scenario: 成功寫入通知
- **WHEN** Server Action 呼叫 `createNotification` 並傳入有效的 userId、title、body
- **THEN** 系統在 `notifications` 資料表新增一筆記錄，`isRead` 預設為 `false`

#### Scenario: 通知寫入失敗不阻塞主操作
- **WHEN** `createNotification` 內部發生例外（如 DB 連線失敗）
- **THEN** 例外被 catch 並記錄至 console.error，主操作回傳結果不受影響

### Requirement: 整合點使用 fire-and-forget 模式
各 Server Action 在主交易完成後 SHALL 以 try/catch 包覆呼叫 `createNotification`，不以 await 阻塞或將通知失敗納入 ActionResponse 的 success 判斷。

#### Scenario: 開課成功後發送通知
- **WHEN** `createCourseSession` 成功完成 CourseOrder + CourseInvite transaction
- **THEN** 系統非同步寫入通知給開課教師，toast 正常顯示，不受通知寫入結果影響

### Requirement: 通知整合範圍
以下操作成功時 SHALL 各自寫入 Inbox 通知：

| 操作 | Action | 通知對象 | 標題範例 |
|------|--------|---------|---------|
| 開課完成 | `createCourseSession` | 開課教師（自己） | `開課完成` |
| 取消課程 | `cancelCourseSession` | 開課教師（自己） | `課程已取消` |
| 學員核准 | `approveEnrollment` | 申請學員 | `報名審核通過` |
| 課程結業 | `graduateCourse` | 開課教師（自己） | `課程結業完成` |

#### Scenario: 開課完成通知內容
- **WHEN** `createCourseSession` 成功
- **THEN** 通知 title 為 `開課完成`，body 包含課程名稱與預計開課日期

#### Scenario: 取消課程通知內容
- **WHEN** `cancelCourseSession` 成功
- **THEN** 通知 title 為 `課程已取消`，body 包含課程名稱與取消原因

#### Scenario: 學員核准通知內容
- **WHEN** `approveEnrollment` 成功
- **THEN** 通知 title 為 `報名審核通過`，body 包含課程名稱，通知寫入申請學員的 userId

#### Scenario: 課程結業通知內容
- **WHEN** `graduateCourse` 成功
- **THEN** 通知 title 為 `課程結業完成`，body 包含課程名稱與結業學員數
