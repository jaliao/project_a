## ADDED Requirements

### Requirement: 學習紀錄頁面
系統 SHALL 提供 `/learning` 頁面（已登入使用者可存取），分兩區塊顯示當前使用者的學習歷程：
1. **已完成學習**：以學員身份加入的邀請（InviteEnrollment），含課程名稱、授課教師姓名、加入時間
2. **已完成授課**：以教師身份建立的邀請（CourseInvite），含課程名稱、報名人數、建立時間

#### Scenario: 有學習紀錄的使用者
- **WHEN** 有 InviteEnrollment 的使用者進入 /learning
- **THEN** 「已完成學習」區塊顯示每筆邀請的課程名稱、授課教師（createdBy.realName 或 name）、加入時間

#### Scenario: 有授課紀錄的使用者
- **WHEN** 有 CourseInvite 的使用者進入 /learning
- **THEN** 「已完成授課」區塊顯示每筆邀請的課程名稱、報名人數（enrollments count）、建立時間

#### Scenario: 無任何紀錄時顯示空狀態
- **WHEN** 使用者沒有任何 InviteEnrollment 且沒有任何 CourseInvite
- **THEN** 兩個區塊各自顯示對應的空狀態提示文字

### Requirement: 學習進度摘要
學習紀錄頁面頂部 SHALL 顯示使用者當前的學習進度等級（learningLevel），以視覺化方式呈現四個等級的完成狀態。

#### Scenario: learningLevel 為 1 的使用者
- **WHEN** learningLevel = 1 的使用者進入 /learning
- **THEN** 頁面頂部顯示 啟動靈人 1 已完成，啟動靈人 2～4 未完成

#### Scenario: learningLevel 為 0 的使用者
- **WHEN** 尚未完成任何課程的使用者進入 /learning
- **THEN** 四個等級均顯示未完成狀態

### Requirement: Dashboard 新增學習紀錄入口
Dashboard 首頁 SHALL 提供前往 `/learning` 的快速連結或按鈕，讓使用者快速查閱學習歷程。

#### Scenario: Dashboard 顯示學習紀錄連結
- **WHEN** 已登入使用者進入 Dashboard
- **THEN** 頁面上可見「學習紀錄」連結或按鈕，點擊後導向 /learning
