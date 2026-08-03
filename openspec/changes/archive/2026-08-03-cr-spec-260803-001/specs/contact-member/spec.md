## ADDED Requirements

### Requirement: Topbar 站內訊息入口
Topbar SHALL 對所有登入會員提供「站內訊息」圖示按鈕，點擊後導向 `/user/{spiritId}/messages`（本人）。

#### Scenario: 點擊站內訊息按鈕
- **WHEN** 已登入會員點擊 Topbar「站內訊息」按鈕
- **THEN** 系統導向 `/user/{spiritId}/messages`（`spiritId` 為本人）

### Requirement: 檢視與管理者的對話串
`/user/{spiritId}/messages` 頁面 SHALL 僅供本人存取，顯示自己與管理者的對話串（依時間排序的完整訊息記錄）；若管理者尚未主動開啟過對話，SHALL 顯示空狀態提示，不提供發起新對話的入口。

#### Scenario: 已有對話時顯示訊息記錄
- **WHEN** 會員造訪自己的 `/user/{spiritId}/messages`，且管理者已對其開啟過對話
- **THEN** 頁面顯示完整訊息記錄（依時間排序），含各則訊息的寄件者顯示名稱與內容

#### Scenario: 尚無對話時顯示空狀態
- **WHEN** 會員造訪自己的 `/user/{spiritId}/messages`，且管理者尚未對其開啟過對話
- **THEN** 頁面顯示空狀態提示，不顯示訊息輸入框

#### Scenario: 無法存取他人對話
- **WHEN** 會員造訪非本人的 `/user/{other spiritId}/messages`
- **THEN** 系統不顯示該他人的對話內容（比照既有本人頁面存取限制）

### Requirement: 會員於既有對話中回覆
已有對話的會員 SHALL 能在對話串中送出訊息回覆；會員 SHALL NOT 能自行發起新的對話（僅能在管理者已開啟的既有對話中回覆）。

#### Scenario: 會員成功回覆
- **WHEN** 已有對話的會員於訊息輸入框填寫內容（trim 後 1–2000 字）並送出
- **THEN** 系統建立一則 `ConversationMessage`，訊息即時顯示於對話串底部

#### Scenario: 空內容被拒
- **WHEN** 會員送出空白或僅空白字元的訊息
- **THEN** 系統拒絕並顯示必填提示，不建立訊息

#### Scenario: 超過長度上限被拒
- **WHEN** 會員送出超過 2000 字的訊息
- **THEN** 系統拒絕並顯示長度上限提示，不建立訊息

### Requirement: 會員回覆後通知管理者
會員於對話中送出訊息後，系統 SHALL 通知該對話目前已加入的管理者參與者（Inbox 通知）。

#### Scenario: 會員回覆觸發管理者通知
- **WHEN** 會員於既有對話送出一則訊息
- **THEN** 該對話目前所有管理者參與者（發起的管理者，以及後續曾在此對話回覆過的其他管理者）皆收到「有新訊息」Inbox 通知
