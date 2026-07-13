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
課程詳情頁 SHALL 顯示「**課程基本資訊**」區塊，欄位依序為：授課老師（realName 或 name + email）、報名人數、預計開課日期（CourseOrder.courseDate）、報名截止日期（expiredAt）、開始上課日期、課程結業日期。
課程已開始（`startedAt != null`）時 SHALL 顯示**開始上課日期**；課程已結業（`completedAt != null`）時 SHALL 再顯示**課程結業日期**。兩者對所有可檢視課程頁的使用者可見。

#### Scenario: 顯示完整基本資訊
- **WHEN** 使用者開啟課程詳情頁
- **THEN** 「課程基本資訊」區塊依序顯示授課老師、報名人數、預計開課日期、報名截止日期（及已開始/已結業時的兩個日期欄位）

#### Scenario: 開課日期或截止日期為空
- **WHEN** CourseOrder.courseDate 或 expiredAt 為 null
- **THEN** 對應欄位顯示「—」或不顯示該列

#### Scenario: 進行中顯示開始上課日期
- **WHEN** 課程 `startedAt != null` 且尚未結業
- **THEN** 區塊顯示開始上課日期（`startedAt` 格式化為日期），不顯示課程結業日期

#### Scenario: 已結業顯示兩個日期
- **WHEN** 課程 `completedAt != null`
- **THEN** 區塊同時顯示開始上課日期與課程結業日期

#### Scenario: 招生中不顯示
- **WHEN** 課程 `startedAt = null`
- **THEN** 區塊不顯示開始上課日期與課程結業日期列

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
課程詳情頁 SHALL 以**卡片式**顯示所有 `status=approved` 的 InviteEnrollment 學員：每張卡片包含姓名、書籍選擇（materialChoice 標籤）、加入時間；SHALL NOT 顯示學員 Email。手機單欄、較寬視窗雙欄排列。

#### Scenario: 有已核准學員
- **WHEN** 課程有至少一筆 status=approved 的 InviteEnrollment
- **THEN** 頁面以卡片顯示每位學員的姓名、materialChoice 標籤、joinedAt，不含 Email

#### Scenario: 尚無已核准學員
- **WHEN** 課程無任何 status=approved 記錄
- **THEN** 顯示「尚無已核准學員」空狀態

### Requirement: 講師專屬：複製邀請連結
講師（CourseInvite.createdById == 當前使用者）SHALL 在**課程基本資訊卡片下方**看到「複製邀請連結」按鈕，點擊後複製 `/invite/{token}` 連結至剪貼簿。

#### Scenario: 講師複製連結
- **WHEN** 講師點擊「複製邀請連結」按鈕
- **THEN** 連結複製至剪貼簿，按鈕短暫顯示「已複製！」

#### Scenario: 複製按鈕位置
- **WHEN** 講師開啟課程詳情頁
- **THEN** 複製邀請連結按鈕顯示於課程基本資訊卡片內的底部一列，與「編輯」按鈕同排

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

### Requirement: 頁首手機版排版
課程詳情頁頁首 SHALL 依序呈現：第一列為**標籤列（課程等級、課程狀態，`sm` 尺寸）**；第二列為課程標題，獨占一行、不與標籤同列（不被擠壓折行；過長時自然換行完整顯示）。頁首 SHALL NOT 放置操作按鈕；「編輯」與「複製邀請連結」按鈕 SHALL 位於**課程基本資訊卡片下方**（卡片內底部一列）。手機視窗下不得產生水平捲動。

#### Scenario: 標籤列於標題上方
- **WHEN** 使用者開啟課程詳情頁
- **THEN** 第一列顯示課程標籤（sm 尺寸），課程標題於其下方獨占整行

#### Scenario: 手機視窗標題完整顯示
- **WHEN** 使用者以手機視窗（<640px）開啟課程詳情頁
- **THEN** 課程標題獨占整行完整顯示，頁面無水平捲動

#### Scenario: 操作按鈕位於課程基本資訊卡片下方
- **WHEN** 授課老師或管理者開啟未取消課程的詳情頁
- **THEN** 「編輯」與「複製邀請連結」按鈕顯示於課程基本資訊卡片內的底部一列，頁首無按鈕

#### Scenario: 編輯按鈕顯示為 icon＋「編輯」
- **WHEN** 授課老師或管理者開啟未取消課程的詳情頁
- **THEN** 編輯入口按鈕顯示為編輯 icon＋文字「編輯」（點擊後 Dialog 標題仍為「編輯課程資訊」）

### Requirement: 區塊標題與內文字體標準
課程詳情頁所有內容區塊（課程基本資訊、結業資訊、已核准學員、待審申請、講師操作區各段、公開媒合、學員申請區、課程 FAQ）的標題 SHALL 採統一樣式：**語意對應的 icon＋粗體標題（`text-base font-semibold`）**，比照學員頁面（`/user/[spiritId]`）既有標準。
內文字級 SHALL 一致：內文 `text-sm`；輔助說明、標籤與時間戳 `text-xs`（muted）。FAQ 區塊的提問/回覆內文、作者名與時間戳 SHALL 套用相同標準。

#### Scenario: 區塊標題樣式一致
- **WHEN** 使用者開啟課程詳情頁
- **THEN** 每個內容區塊標題皆為 icon＋粗體字（text-base font-semibold），無區塊沿用舊的小字灰階標題

#### Scenario: FAQ 字級對齊
- **WHEN** 使用者檢視課程 FAQ 區塊
- **THEN** 區塊標題為 icon＋粗體字；提問與回覆內文為 text-sm、時間戳為 text-xs，與頁面其他區塊一致

### Requirement: 主要操作按鈕樣式一致
課程詳情頁的主要動作按鈕 SHALL 採一致的預設主色樣式與預設尺寸：「開始上課」「結業」為預設主色按鈕；FAQ 的「送出提問」「送出回覆」與其他操作按鈕同尺寸。破壞性動作（取消授課、刪除留言）維持 destructive／outline 語意樣式。

#### Scenario: 結業與開始上課同為主色按鈕
- **WHEN** 講師檢視進行中課程的操作區
- **THEN** 「結業」按鈕與「開始上課」同為預設主色（藍色）樣式

#### Scenario: FAQ 送出按鈕與其他按鈕一致
- **WHEN** 使用者檢視 FAQ 送出提問／送出回覆按鈕
- **THEN** 按鈕為預設尺寸與主色樣式，與頁面其他主要操作按鈕一致

