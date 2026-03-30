## ADDED Requirements

### Requirement: 透過 Spirit ID 邀請學員
系統 SHALL 提供 `inviteBySpirtId(courseInviteId, spiritId)` server action，查找對應 User 後發送 Inbox 通知，通知內容包含課程名稱與邀請連結。學員仍需自行點擊連結完成加入流程。

#### Scenario: Spirit ID 查找成功並發送通知
- **WHEN** server action 收到有效的 courseInviteId 與存在的 spiritId
- **THEN** 系統查找 `User.spiritId === spiritId`，呼叫 `createNotification(userId, '課程邀請', body)`，body 包含課程名稱與 `{origin}/invite/{token}` 連結，回傳 success

#### Scenario: Spirit ID 不存在
- **WHEN** server action 收到不存在的 spiritId
- **THEN** 系統回傳錯誤「找不到此會員編號，請確認後重試」，不發送通知

#### Scenario: courseInviteId 無效
- **WHEN** server action 收到不存在的 courseInviteId
- **THEN** 系統回傳錯誤「課程邀請不存在」，不發送通知

#### Scenario: 通知發送失敗不阻塞回應
- **WHEN** `createNotification` 內部發生例外
- **THEN** 例外被 catch 並記錄至 console.error，action 仍回傳 success（fire-and-forget 模式）
