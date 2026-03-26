## MODIFIED Requirements

### Requirement: 建立開課邀請
系統 SHALL 提供「開課邀請」建立 Dialog（由 Dashboard 觸發），教師填寫課程名稱、預計人數，並可選擇關聯一筆 CourseOrder，系統建立 CourseInvite 記錄並顯示課程頁面連結（格式：`{origin}/course/{id}`）供複製分享。

#### Scenario: 成功建立邀請（不關聯訂單）
- **WHEN** 教師填寫課程名稱與預計人數（不選擇 CourseOrder）並提交
- **THEN** 系統儲存 `CourseInvite`（courseOrderId 為 null），顯示課程連結（格式：`{origin}/course/{id}`）

#### Scenario: 成功建立邀請（關聯訂單）
- **WHEN** 教師填寫課程名稱、預計人數並選擇一筆 CourseOrder 後提交
- **THEN** 系統儲存 `CourseInvite`（courseOrderId 指向該訂單），顯示課程連結

#### Scenario: 必填欄位空白時提交
- **WHEN** 教師未填寫課程名稱或預計人數即提交
- **THEN** 系統顯示對應欄位錯誤提示，不建立邀請

### Requirement: 複製課程連結
建立邀請成功後，系統 SHALL 顯示課程頁面連結（`/course/{id}`）並提供「複製連結」按鈕，點擊後將連結複製至剪貼簿並顯示「已複製」提示。

#### Scenario: 複製課程連結
- **WHEN** 教師點擊「複製連結」按鈕
- **THEN** 系統將 `/course/{id}` 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

## REMOVED Requirements

### Requirement: 邀請連結公開存取
**Reason**: 改用 `/course/{id}` 直接連結，不再需要 token-based 公開路由
**Migration**: 教師分享 `/course/{id}` URL；學員登入後直接在課程頁面申請加入
