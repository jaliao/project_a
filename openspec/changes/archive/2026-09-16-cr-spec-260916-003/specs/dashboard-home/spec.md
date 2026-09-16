## REMOVED Requirements

### Requirement: 開課邀請快速入口
**Reason**: `/dashboard` 路由已改為純轉址（導向 `/user/[spiritId]` 或 `/profile`），不再渲染 `DashboardActions`，此按鈕與其開啟的 `CreateInviteDialog` 全專案零引用，屬功能死碼，隨舊版「開課邀請」流程一併清除。
**Migration**: 老師改用課程詳情頁既有「新增授課」（`CourseSessionDialog`）流程建立課程。

### Requirement: 查看邀請進度快捷入口
**Reason**: 同上，對應的 `/invites` 頁面已一併移除（見 `invite-progress` 規格）。
**Migration**: 老師改於課程詳情頁的「已核准學員清單」查看報名狀況，或使用課程詳情頁新的「分享」按鈕邀請學員（見 `course-session-detail` 規格「講師專屬：課程分享」需求）。
