## ADDED Requirements

### Requirement: 邀請進度頁
系統 SHALL 提供 `/invites` 路由，顯示當前登入教師建立的所有邀請列表，每筆邀請包含：課程名稱、預計人數、已確認人數、建立時間。

#### Scenario: 有邀請記錄時
- **WHEN** 教師存取 `/invites`
- **THEN** 頁面顯示該教師建立的所有邀請，依建立時間降冪排列

#### Scenario: 無邀請記錄時
- **WHEN** 教師尚未建立任何邀請
- **THEN** 頁面顯示空狀態提示「尚未建立任何邀請」

### Requirement: 邀請詳細報名狀態
每筆邀請 SHALL 可展開或導向詳細頁，顯示每位已加入學員的名稱、Email 與加入時間。

#### Scenario: 查看學員列表
- **WHEN** 教師點擊某邀請的「查看學員」
- **THEN** 顯示該邀請下所有已加入學員（name、email、joinedAt）

#### Scenario: 尚無學員加入
- **WHEN** 邀請下尚無任何 InviteEnrollment 記錄
- **THEN** 顯示「尚無學員加入」

### Requirement: 複製邀請連結（進度頁）
邀請列表中每筆邀請 SHALL 提供「複製連結」快速操作，行為與建立邀請後的複製功能相同。

#### Scenario: 從進度頁複製連結
- **WHEN** 教師在 `/invites` 點擊某邀請的「複製連結」
- **THEN** 將該邀請連結複製至剪貼簿，顯示「已複製！」提示
