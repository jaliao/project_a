# course-session-detail Delta Specification

> 基底：本檔「基本資訊區塊」以未歸檔變更 `cr-spec-260703-001` 修改後內容為基底，歸檔順序須 260703-001 在前。

## ADDED Requirements

### Requirement: 頁首手機版排版
課程詳情頁頁首 SHALL 以「標題獨立成行」呈現：課程標題不與標籤或按鈕同列（不被擠壓折行；過長時自然換行完整顯示）。標題下方 SHALL 為標籤列（課程等級、課程狀態）與操作按鈕（編輯、複製邀請連結）的同列排布，手機視窗下不得產生水平捲動。

#### Scenario: 手機視窗標題完整顯示
- **WHEN** 使用者以手機視窗（<640px）開啟課程詳情頁
- **THEN** 課程標題獨占整行完整顯示，標籤與按鈕於標題下方排列，頁面無水平捲動

#### Scenario: 編輯按鈕顯示為 icon＋「編輯」
- **WHEN** 授課老師或管理者開啟未取消課程的詳情頁
- **THEN** 編輯入口按鈕顯示為編輯 icon＋文字「編輯」（點擊後 Dialog 標題仍為「編輯課程資訊」）

## MODIFIED Requirements

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

### Requirement: 已核准學員清單
課程詳情頁 SHALL 以**卡片式**顯示所有 `status=approved` 的 InviteEnrollment 學員：每張卡片包含姓名、書籍選擇（materialChoice 標籤）、加入時間；SHALL NOT 顯示學員 Email。手機單欄、較寬視窗雙欄排列。

#### Scenario: 有已核准學員
- **WHEN** 課程有至少一筆 status=approved 的 InviteEnrollment
- **THEN** 頁面以卡片顯示每位學員的姓名、materialChoice 標籤、joinedAt，不含 Email

#### Scenario: 尚無已核准學員
- **WHEN** 課程無任何 status=approved 記錄
- **THEN** 顯示「尚無已核准學員」空狀態
