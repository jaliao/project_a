## ADDED Requirements

### Requirement: 我的開課頁面路由
系統 SHALL 提供 `/user/{spiritId}/courses` 路由，顯示該學員所建立的所有開課（CourseInvite）列表。僅本人可存取；存取他人的 `/user/{spiritId}/courses` SHALL 回傳 403 或重定向至本人頁面。

#### Scenario: 本人存取我的開課頁面
- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}/courses`
- **THEN** 系統顯示該使用者建立的所有 CourseInvite 列表

#### Scenario: 存取他人開課頁面
- **WHEN** 已登入使用者存取他人的 `/user/{otherSpiritId}/courses`
- **THEN** 系統重定向至本人的 `/user/{selfSpiritId}/courses`

#### Scenario: 未登入使用者存取
- **WHEN** 未登入使用者存取 `/user/{spiritId}/courses`
- **THEN** 系統重定向至 `/login?callbackUrl=/user/{spiritId}/courses`

### Requirement: 開課列表顯示
`/user/{spiritId}/courses` SHALL 以卡片列表呈現每筆 CourseInvite，使用 CourseSessionCard 元件（compact variant），點擊卡片導向 `/course/{id}`。

#### Scenario: 有開課記錄
- **WHEN** 使用者存取我的開課頁面且有建立過 CourseInvite
- **THEN** 頁面顯示每筆 CourseInvite 的 CourseSessionCard，含課程名稱、課程等級、開課日期、報名人數、截止日期

#### Scenario: 無開課記錄
- **WHEN** 使用者存取我的開課頁面且尚未建立任何 CourseInvite
- **THEN** 頁面顯示空狀態提示文字「尚無開課記錄」

### Requirement: 返回學員頁面連結
我的開課頁面 SHALL 提供返回 `/user/{spiritId}` 的連結。

#### Scenario: 點擊返回連結
- **WHEN** 使用者點擊「返回」連結
- **THEN** 系統導向 `/user/{spiritId}`
