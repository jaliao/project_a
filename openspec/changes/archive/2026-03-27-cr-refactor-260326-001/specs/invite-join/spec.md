## REMOVED Requirements

### Requirement: 學員透過邀請連結加入課程
**Reason**: 移除 token-based 邀請連結機制，學員改由 `/course/{id}` 直接申請加入
**Migration**: 學員存取課程頁面 `/course/{id}` 並點擊「申請加入」按鈕完成報名流程

### Requirement: 首頁顯示加入成功提示
**Reason**: 隨 `/invite/[token]` 路由一同移除，該 toast 由 `enrolled=1` query param 觸發，此流程已廢棄
**Migration**: 學員申請成功後由課程頁面的申請流程提供即時回饋
