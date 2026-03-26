## MODIFIED Requirements

### Requirement: 開課成功後發送 Inbox 通知
系統 SHALL 在 `createCourseSession` 成功完成後，呼叫 `createNotification` 寫入一則 Inbox 通知給開課教師，通知標題為「開課完成」，內容包含課程名稱與預計開課日期。

#### Scenario: 開課成功寫入通知
- **WHEN** `createCourseSession` 完成 CourseOrder + CourseInvite 的 atomic transaction
- **THEN** 系統寫入通知至開課教師的 Inbox，`notifications` 新增一筆記錄
- **THEN** toast 成功訊息正常顯示，不受通知寫入影響

#### Scenario: 通知寫入失敗不影響開課結果
- **WHEN** `createCourseSession` 成功但 `createNotification` 發生例外
- **THEN** `createCourseSession` 仍回傳 `{ success: true, data: { inviteId, token } }`
- **THEN** 例外記錄於 console.error
