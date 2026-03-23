## ADDED Requirements

### Requirement: 學員透過邀請連結加入課程
已登入使用者存取 `/invite/[token]` 時，系統 SHALL 驗證 token，建立 `InviteEnrollment` 記錄，並 redirect 至 `/dashboard?enrolled=1`。

#### Scenario: 已登入學員首次加入
- **WHEN** 已登入使用者存取有效的 `/invite/[token]`
- **THEN** 系統建立 `InviteEnrollment`（userId + inviteId），redirect 至 `/dashboard?enrolled=1`

#### Scenario: 已登入學員重複加入
- **WHEN** 已登入使用者存取已加入過的邀請 token
- **THEN** 系統不重複建立記錄，直接 redirect 至 `/dashboard?enrolled=1`

#### Scenario: 存取無效 token
- **WHEN** 已登入使用者存取不存在的 token
- **THEN** 系統顯示「邀請連結無效或已失效」，不建立記錄

### Requirement: 首頁顯示加入成功提示
使用者從邀請連結加入後導向 `/dashboard?enrolled=1` 時，首頁 SHALL 顯示「已成功加入課程」的提示 toast 或 Dialog。

#### Scenario: 加入成功後顯示提示
- **WHEN** 使用者被導向 `/dashboard?enrolled=1`
- **THEN** 首頁顯示「已成功加入課程！」toast 通知

#### Scenario: 正常訪問首頁不顯示提示
- **WHEN** 使用者直接訪問 `/dashboard`（無 `enrolled` query param）
- **THEN** 首頁不顯示加入提示
