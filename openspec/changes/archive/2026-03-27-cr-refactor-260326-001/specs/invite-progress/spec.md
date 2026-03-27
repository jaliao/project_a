## MODIFIED Requirements

### Requirement: 複製課程連結（進度頁）
邀請列表中每筆邀請 SHALL 提供「複製連結」快速操作，複製對應課程頁面 URL（`{origin}/course/{id}`）至剪貼簿。

#### Scenario: 從進度頁複製課程連結
- **WHEN** 教師在 `/invites` 點擊某邀請的「複製連結」
- **THEN** 將 `/course/{id}` 連結複製至剪貼簿，顯示「已複製！」提示
