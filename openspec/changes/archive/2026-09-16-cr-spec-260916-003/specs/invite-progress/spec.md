## REMOVED Requirements

### Requirement: 邀請進度頁
**Reason**: `/invites` 頁面的唯一 UI 入口（首頁 `DashboardActions` 的「查看邀請進度」按鈕）已隨 `/dashboard` 改為純轉址而完全無法觸達，全專案零引用，屬功能死碼，隨舊版「開課邀請」流程一併清除。
**Migration**: 老師查看課程報名狀況與學員名單，改於課程詳情頁（`/course/{id}`）的「已核准學員清單」查看，功能對等。

### Requirement: 邀請詳細報名狀態
**Reason**: 同上，隨 `/invites` 頁面一併移除。
**Migration**: 課程詳情頁「已核准學員清單」已提供對等的學員名單與加入時間資訊。

### Requirement: 複製邀請連結（進度頁）
**Reason**: 同上，隨 `/invites` 頁面一併移除；課程詳情頁的分享功能（見 `course-session-detail` 規格「講師專屬：課程分享」需求）已提供更完整的複製連結與邀請管道。
**Migration**: 改用課程詳情頁的「分享」按鈕。
