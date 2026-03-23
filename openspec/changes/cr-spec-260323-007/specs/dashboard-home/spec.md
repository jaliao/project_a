## ADDED Requirements

### Requirement: 開課邀請快速入口
首頁 SHALL 在統計卡片區下方或操作區新增「開課邀請」按鈕，點擊後開啟建立邀請 Dialog。

#### Scenario: 點擊開課邀請按鈕
- **WHEN** 教師點擊首頁「開課邀請」按鈕
- **THEN** 系統開啟建立邀請 Dialog（CreateInviteDialog）

### Requirement: 查看邀請進度快捷入口
首頁 SHALL 提供「查看邀請進度」連結，點擊後導向 `/invites`。

#### Scenario: 點擊查看邀請進度
- **WHEN** 使用者點擊「查看邀請進度」連結
- **THEN** 系統導向 `/invites`

### Requirement: 加入課程成功 toast
首頁 SHALL 偵測 `?enrolled=1` query param，若存在則顯示「已成功加入課程！」toast，並清除 query param（避免重新整理重複顯示）。

#### Scenario: 從邀請連結加入後顯示 toast
- **WHEN** 使用者被導向 `/dashboard?enrolled=1`
- **THEN** 首頁顯示「已成功加入課程！」toast

#### Scenario: 直接訪問首頁不顯示 toast
- **WHEN** 使用者直接訪問 `/dashboard`
- **THEN** 不顯示加入課程 toast
