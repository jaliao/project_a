## MODIFIED Requirements

### Requirement: 課程詳情頁路由
系統 SHALL 提供 `/course/[id]` 路由，顯示單一開課（CourseInvite）的完整資訊，並依當前使用者角色（講師 / 學員）呈現不同操作區塊。

#### Scenario: 有效課程 ID
- **WHEN** 已登入使用者存取 `/course/123`（id=123 存在）
- **THEN** 頁面顯示該課程的完整資訊

#### Scenario: 無效課程 ID
- **WHEN** 使用者存取不存在的課程 ID
- **THEN** 頁面顯示 404 或「找不到課程」提示

### Requirement: 基本資訊區塊
課程詳情頁 SHALL 顯示基本資訊區塊，包含：開課內容（title）、課程等級、開課日期（CourseOrder.courseDate）、報名截止日期（expiredAt）、授課老師（realName 或 name + email）。

#### Scenario: 顯示完整基本資訊
- **WHEN** 使用者開啟課程詳情頁
- **THEN** 頁面顯示課程名稱、等級標籤、開課日期、報名截止日期、授課老師姓名與 Email

#### Scenario: 開課日期或截止日期為空
- **WHEN** CourseOrder.courseDate 或 expiredAt 為 null
- **THEN** 對應欄位顯示「—」或不顯示該列

### Requirement: 顯示課程狀態標籤
課程詳情頁標題旁 SHALL 依 CourseInvite 狀態顯示對應標籤：已取消（cancelledAt）、已結業（completedAt）、進行中（兩者皆 null）。

#### Scenario: 課程已取消
- **WHEN** CourseInvite.cancelledAt 不為 null
- **THEN** 顯示「已取消」標籤，並顯示取消原因

#### Scenario: 課程已結業
- **WHEN** CourseInvite.completedAt 不為 null
- **THEN** 顯示「已結業」標籤

#### Scenario: 課程進行中
- **WHEN** cancelledAt 與 completedAt 皆為 null
- **THEN** 不顯示狀態標籤（或顯示「進行中」）

### Requirement: 已核准學員清單
課程詳情頁 SHALL 顯示所有 `status=approved` 的 InviteEnrollment 學員，包含姓名、Email、書籍選擇、加入時間。

#### Scenario: 有已核准學員
- **WHEN** 課程有至少一筆 status=approved 的 InviteEnrollment
- **THEN** 頁面顯示每位學員的姓名、Email、materialChoice 標籤、joinedAt

#### Scenario: 尚無已核准學員
- **WHEN** 課程無任何 status=approved 記錄
- **THEN** 顯示「尚無已核准學員」空狀態

### Requirement: 講師專屬：複製邀請連結
講師（CourseInvite.createdById == 當前使用者）SHALL 在頁面看到「複製邀請連結」按鈕，點擊後複製 `/invite/{token}` 連結至剪貼簿。

#### Scenario: 講師複製連結
- **WHEN** 講師點擊「複製邀請連結」
- **THEN** 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

### Requirement: 講師專屬：取消授課
沿用 cr-spec-260324-011 實作，僅在課程未取消且未結業時顯示「取消授課」按鈕。

#### Scenario: 取消授課按鈕可見條件
- **WHEN** 使用者為講師且課程未取消、未結業
- **THEN** 顯示「取消授課」按鈕
