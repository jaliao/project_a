## ADDED Requirements

### Requirement: Dashboard 開課預覽列表
Dashboard SHALL 在授課功能卡片上方顯示「已新增的開課」區塊，列出當前教師最近 5 筆開課記錄，使用 CourseSessionCard（variant="compact"）呈現。

#### Scenario: 有開課記錄時顯示卡片
- **WHEN** 已登入使用者進入 Dashboard 且已建立至少一筆開課
- **THEN** 授課功能卡片上方顯示「已新增的開課」標題與最多 5 張課程卡片

#### Scenario: 無開課記錄時不顯示區塊
- **WHEN** 已登入使用者進入 Dashboard 且尚無任何開課記錄
- **THEN** 不顯示「已新增的開課」區塊

### Requirement: Dashboard 開課預覽「查看全部」連結
當開課記錄超過 5 筆時，系統 SHALL 在預覽列表底部顯示「查看全部」連結，導向 `/course-sessions`。

#### Scenario: 超過 5 筆開課
- **WHEN** 教師已建立超過 5 筆開課
- **THEN** 列表底部顯示「查看全部」連結

#### Scenario: 5 筆以內開課
- **WHEN** 教師開課記錄為 5 筆或以下
- **THEN** 不顯示「查看全部」連結
