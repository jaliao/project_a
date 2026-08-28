## REMOVED Requirements

### Requirement: 課程 FAQ 留言區塊
**Reason**: 課程 FAQ 功能整組下架（CR-SPEC-260828-004）。1 對 1 留言問答區塊與「聯繫管理者」「站內訊息」重疊，維護成本大於價值。
**Migration**: 課程詳情頁 `/course/[id]` 不再顯示「課程 FAQ」區塊。學員／講師與管理者的溝通改用「聯繫管理者」或「站內訊息」。`course_messages` 資料表與歷史資料保留，僅可由資料庫直接查閱。

### Requirement: 會員提問
**Reason**: 課程 FAQ 功能整組下架（CR-SPEC-260828-004）。
**Migration**: 移除 `postCourseQuestion` server action 與提問輸入框；不再寫入「課程有新提問」Inbox 通知。

### Requirement: 授課老師回覆
**Reason**: 課程 FAQ 功能整組下架（CR-SPEC-260828-004）。
**Migration**: 移除 `replyCourseMessage` server action 與回覆表單；不再寫入「課程提問已回覆」Inbox 通知。

### Requirement: 刪除留言
**Reason**: 課程 FAQ 功能整組下架（CR-SPEC-260828-004）。
**Migration**: 移除 `deleteCourseMessage` server action 與刪除按鈕。既有 `course_messages` 資料保留；`CourseMessage` 仍依 `onDelete: Cascade` 隨課程刪除而清除。
