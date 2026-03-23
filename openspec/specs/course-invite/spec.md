## ADDED Requirements

### Requirement: 建立開課邀請
系統 SHALL 提供「開課邀請」建立 Dialog（由 Dashboard 觸發），教師填寫課程名稱、預計人數，並可選擇關聯一筆 CourseOrder，系統產生唯一邀請 token 並顯示可複製的邀請連結。

#### Scenario: 成功建立邀請（不關聯訂單）
- **WHEN** 教師填寫課程名稱與預計人數（不選擇 CourseOrder）並提交
- **THEN** 系統儲存 `CourseInvite`（courseOrderId 為 null），顯示邀請連結（格式：`{origin}/invite/{token}`）

#### Scenario: 成功建立邀請（關聯訂單）
- **WHEN** 教師填寫課程名稱、預計人數並選擇一筆 CourseOrder 後提交
- **THEN** 系統儲存 `CourseInvite`（courseOrderId 指向該訂單），顯示邀請連結

#### Scenario: 必填欄位空白時提交
- **WHEN** 教師未填寫課程名稱或預計人數即提交
- **THEN** 系統顯示對應欄位錯誤提示，不建立邀請

### Requirement: 複製邀請連結
建立邀請成功後，系統 SHALL 顯示邀請連結並提供「複製連結」按鈕，點擊後將連結複製至剪貼簿並顯示「已複製」提示。

#### Scenario: 複製邀請連結
- **WHEN** 教師點擊「複製連結」按鈕
- **THEN** 系統將邀請連結複製至剪貼簿，按鈕短暫顯示「已複製！」

### Requirement: 邀請連結公開存取
`/invite/[token]` 路由 SHALL 列入 middleware 公開白名單，未登入使用者存取時 SHALL 保留 token 資訊並導向登入頁，登入後導回邀請頁完成加入流程。

#### Scenario: 未登入存取邀請連結
- **WHEN** 未登入使用者存取 `/invite/ABC123`
- **THEN** middleware 導向 `/login?callbackUrl=/invite/ABC123`

#### Scenario: 無效 token 存取
- **WHEN** 使用者存取不存在的 token 路徑
- **THEN** 系統顯示「邀請連結無效或已失效」訊息
