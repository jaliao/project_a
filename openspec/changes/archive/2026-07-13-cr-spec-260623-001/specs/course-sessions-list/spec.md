# course-sessions-list Delta Specification

## REMOVED Requirements

### Requirement: 開課查詢頁路由
**Reason**: `/course-sessions` 為孤兒頁（站內無入口），功能已由個人頁「我的授課」（`/user/[spiritId]/courses`）承接，整頁廢除。
**Migration**: 個人課程清單改用 `/user/[spiritId]/courses`；直接命中 `/course-sessions` 顯示友善 404，不設轉導。

### Requirement: 開課查詢頁顯示全部記錄（含已結束）
**Reason**: 隨頁面廢除；「我的授課」頁已提供同等清單（同用 `getMyCourseSessions` 與 `CourseSessionCard`）。
**Migration**: 使用 `/user/[spiritId]/courses`。

### Requirement: 開課查詢頁標題與返回連結
**Reason**: 隨頁面廢除。
**Migration**: 無（頁面不存在即無標題需求）。
