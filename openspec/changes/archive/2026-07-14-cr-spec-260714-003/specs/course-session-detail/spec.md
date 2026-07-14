# course-session-detail Delta（cr-spec-260714-003）

## MODIFIED Requirements

### Requirement: 已核准學員清單
課程詳情頁 SHALL 以**卡片式**顯示所有 `status=approved` 的 InviteEnrollment 學員：每張卡片包含姓名、書籍選擇（materialChoice 標籤）、加入時間；SHALL NOT 顯示學員 Email。手機單欄、較寬視窗雙欄排列。
區塊標題列右側 SHALL 對**管理者或該課講師**顯示兩顆操作按鈕（樣式比照課程基本資訊「編輯」按鈕）：**新增學員**與**移除學員**；一般學員視角 SHALL 與無按鈕時完全相同。
「新增學員」SHALL 開啟既有新增學員 dialog（email 掛既有帳號／建新帳號＋臨時密碼一次性顯示、可補登結業）。「移除學員」SHALL 切換**移除模式**：各學員卡出現移除按鈕（沿用醒目警示與教材防呆確認流程），且卡片加顯**啟動編號**輔助辨識（仍不顯示 Email）；再次點擊退出移除模式。

#### Scenario: 有已核准學員
- **WHEN** 課程有至少一筆 status=approved 的 InviteEnrollment
- **THEN** 頁面以卡片顯示每位學員的姓名、materialChoice 標籤、joinedAt，不含 Email

#### Scenario: 尚無已核准學員
- **WHEN** 課程無任何 status=approved 記錄
- **THEN** 顯示「尚無已核准學員」空狀態

#### Scenario: 管理者與講師可見操作按鈕
- **WHEN** 管理者或該課講師開啟課程詳情頁
- **THEN** 已核准學員區塊標題列顯示「新增學員」「移除學員」按鈕

#### Scenario: 一般學員不可見操作按鈕
- **WHEN** 非管理者且非該課講師的使用者開啟課程詳情頁
- **THEN** 已核准學員區塊無任何管理按鈕，呈現與現行相同

#### Scenario: 移除模式
- **WHEN** 管理者或講師點擊「移除學員」
- **THEN** 各學員卡出現移除按鈕並加顯啟動編號；再次點擊「移除學員」退出模式

### Requirement: 講師專屬：結業按鈕顯示條件
結業按鈕 SHALL 僅在課程處於進行中狀態時顯示，招生中、已取消、已結業時均不顯示；SHALL 對**該課講師與管理者**顯示。

#### Scenario: 課程進行中時顯示結業按鈕
- **WHEN** 該課講師或管理者查看課程詳情頁，且 isStarted = true、isCancelled = false、isCompleted = false
- **THEN** 顯示「結業」按鈕

#### Scenario: 課程招生中時不顯示結業按鈕
- **WHEN** 講師或管理者查看課程詳情頁，且 CourseInvite.startedAt 為 null
- **THEN** 不顯示「結業」按鈕

#### Scenario: 課程已取消或已結業時不顯示結業按鈕
- **WHEN** isCancelled = true 或 isCompleted = true
- **THEN** 結業作業區塊不渲染

### Requirement: 講師專屬：取消授課
系統 SHALL 僅在課程未取消且未結業時顯示「取消授課」按鈕，對**該課講師與管理者**顯示。教材申請與開始上課區塊 SHALL 維持僅該課講師可見。

#### Scenario: 取消授課按鈕可見條件
- **WHEN** 使用者為該課講師或管理者，且課程未取消、未結業
- **THEN** 顯示「取消授課」按鈕

#### Scenario: 管理者不可見講師專屬區塊
- **WHEN** 管理者（非該課講師）查看課程詳情頁
- **THEN** 教材申請與開始上課區塊不顯示

## ADDED Requirements

### Requirement: 課程操作 LOG 區塊
課程詳情頁 SHALL 對**管理者或該課講師**顯示「課程操作 LOG」區塊（一般學員不可見），列出該課程的管理操作紀錄（時間、操作者、動作、對象、摘要，最新在前、最多 30 筆並註記），內容以紀錄快照欄呈現。

#### Scenario: 管理者與講師可見 LOG
- **WHEN** 管理者或該課講師開啟課程詳情頁且該課有操作紀錄
- **THEN** 顯示「課程操作 LOG」區塊列出該課紀錄（最新在前）

#### Scenario: 學員不可見 LOG
- **WHEN** 一般學員開啟課程詳情頁
- **THEN** 不渲染課程操作 LOG 區塊
