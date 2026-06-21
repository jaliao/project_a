# course-session-detail Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for course-session-detail.

## Requirements

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
課程詳情頁標題旁 SHALL 依 CourseInvite 狀態顯示對應標籤，四種狀態須全數涵蓋。

#### Scenario: 課程已取消
- **WHEN** CourseInvite.cancelledAt 不為 null
- **THEN** 顯示「已取消」標籤（紅色），並顯示取消原因

#### Scenario: 課程已結業
- **WHEN** CourseInvite.completedAt 不為 null 且 cancelledAt 為 null
- **THEN** 顯示「已結業」標籤（綠色）

#### Scenario: 課程進行中
- **WHEN** cancelledAt 與 completedAt 皆為 null，且 CourseInvite.startedAt 不為 null
- **THEN** 顯示「進行中」標籤（藍色）

#### Scenario: 課程招生中
- **WHEN** cancelledAt 與 completedAt 皆為 null，且 CourseInvite.startedAt 為 null
- **THEN** 顯示「招生中」標籤（灰色）

### Requirement: 已核准學員清單
課程詳情頁 SHALL 顯示所有 `status=approved` 的 InviteEnrollment 學員，包含姓名、Email、書籍選擇、加入時間。

#### Scenario: 有已核准學員
- **WHEN** 課程有至少一筆 status=approved 的 InviteEnrollment
- **THEN** 頁面顯示每位學員的姓名、Email、materialChoice 標籤、joinedAt

#### Scenario: 尚無已核准學員
- **WHEN** 課程無任何 status=approved 記錄
- **THEN** 顯示「尚無已核准學員」空狀態

### Requirement: 講師專屬：複製邀請連結
講師（CourseInvite.createdById == 當前使用者）SHALL 在頁首右側看到「複製邀請連結」按鈕，點擊後複製 `/invite/{token}` 連結至剪貼簿。

#### Scenario: 講師複製連結
- **WHEN** 講師點擊頁首右上角的「複製邀請連結」按鈕
- **THEN** 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

#### Scenario: 複製按鈕位置
- **WHEN** 講師開啟課程詳情頁
- **THEN** 複製邀請連結按鈕顯示於頁首標題列右側，與課程狀態標籤同排

### Requirement: 講師專屬：結業按鈕顯示條件
結業按鈕 SHALL 僅在課程處於進行中狀態時顯示，招生中、已取消、已結業時均不顯示。

#### Scenario: 課程進行中時顯示結業按鈕
- **WHEN** 講師查看課程詳情頁，且 isStarted = true、isCancelled = false、isCompleted = false
- **THEN** 顯示「結業」按鈕

#### Scenario: 課程招生中時不顯示結業按鈕
- **WHEN** 講師查看課程詳情頁，且 CourseInvite.startedAt 為 null
- **THEN** 不顯示「結業」按鈕

#### Scenario: 課程已取消或已結業時不顯示結業按鈕
- **WHEN** isCancelled = true 或 isCompleted = true
- **THEN** 整個操作區塊不渲染（既有行為不變）

### Requirement: 講師專屬：取消授課
沿用 cr-spec-260324-011 實作，系統 SHALL 僅在課程未取消且未結業時顯示「取消授課」按鈕。

#### Scenario: 取消授課按鈕可見條件
- **WHEN** 使用者為講師且課程未取消、未結業
- **THEN** 顯示「取消授課」按鈕

### Requirement: 講師專屬：公開媒合設定
課程詳情頁 SHALL 讓課程講師（`createdById === 目前使用者`）或管理者切換「公開媒合」開關並編輯／清除「公開招募備註」，透過 Server Action `updateMatchSettings(inviteId, { isPublicMatch, matchNote })`。關閉公開媒合時 SHALL 保留既有 `matchNote`（不清空），僅不再於布告欄顯示。

#### Scenario: 講師開啟公開媒合
- **WHEN** 課程講師於詳情頁開啟「公開媒合」並儲存
- **THEN** `isPublicMatch = true`，課程出現在媒合布告欄

#### Scenario: 講師編輯招募備註
- **WHEN** 課程講師修改招募備註並儲存
- **THEN** `matchNote` 更新為新內容，布告欄卡片顯示新備註

#### Scenario: 關閉公開媒合保留備註
- **WHEN** 課程講師關閉「公開媒合」
- **THEN** `isPublicMatch = false`、課程自布告欄移除，但 `matchNote` 內容保留

#### Scenario: 非講師不可修改
- **WHEN** 非該課程講師且非管理者的使用者呼叫 `updateMatchSettings`
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不變更資料

### Requirement: 未登入訪客存取課程詳情頁顯示登入提示
未登入使用者存取 `/course/[id]`（數字 id 的課程詳情頁）時，系統 SHALL NOT 直接轉導 `/login`，而是在課程頁顯示登入提示卡片，且 SHALL NOT 顯示任何課程內容（標題、學員清單、FAQ、操作按鈕等）。

提示卡片 SHALL 包含說明文字「無法檢視此課程／請先登入後再檢視課程內容」與「前往登入」按鈕；按鈕 SHALL 導向 `/login?callbackUrl=/course/[id]`，使登入後返回原課程頁。

此放行僅限課程詳情頁本身；其子路徑（如 `/course/[id]/graduate`）與其他需登入頁面 SHALL 維持未登入時強制轉導 `/login`。

#### Scenario: 未登入存取課程詳情頁
- **WHEN** 未登入使用者存取 `/course/123`（id=123）
- **THEN** 頁面顯示登入提示卡片（「無法檢視此課程」與「前往登入」按鈕），不顯示課程內容，且不轉導 `/login`

#### Scenario: 點擊前往登入返回原課程
- **WHEN** 未登入使用者於提示卡片點擊「前往登入」
- **THEN** 導向 `/login?callbackUrl=/course/123`，登入成功後返回 `/course/123`

#### Scenario: 未登入存取課程子路徑仍強制登入
- **WHEN** 未登入使用者存取 `/course/123/graduate`
- **THEN** 系統維持原行為，轉導 `/login`

#### Scenario: 已登入使用者不受影響
- **WHEN** 已登入使用者存取 `/course/123`
- **THEN** 頁面照常顯示完整課程資訊與對應角色操作區塊（行為不變）
