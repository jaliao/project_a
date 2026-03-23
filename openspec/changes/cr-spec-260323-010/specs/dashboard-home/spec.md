## ADDED Requirements

### Requirement: 首頁顯示「新增開課」區塊
首頁 SHALL 在統計卡片下方新增「新增開課」區塊，包含「新增開課」按鈕與已接受邀請的學員清單。

#### Scenario: 進入首頁
- **WHEN** 已登入使用者進入 `/dashboard`
- **THEN** 頁面顯示「新增開課」區塊，內含「新增開課」按鈕

#### Scenario: 點擊新增開課按鈕
- **WHEN** 使用者點擊「新增開課」按鈕
- **THEN** 系統開啟 CourseSessionDialog 合併表單
