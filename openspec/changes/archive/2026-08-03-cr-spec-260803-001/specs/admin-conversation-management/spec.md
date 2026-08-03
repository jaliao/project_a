## ADDED Requirements

### Requirement: 資料模型
系統 SHALL 提供 `Conversation`／`ConversationParticipant`／`ConversationMessage` 資料模型：`Conversation` 記錄一段對話（發起管理者、建立時間、最新訊息時間）；`ConversationParticipant` 為多對多中介表，記錄參與該對話的使用者（本次僅支援一位非管理者參與者，即目標會員，加上一位以上管理者）；`ConversationMessage` 記錄每則訊息（寄件者、內容、時間）。

#### Scenario: 建立對話時同時建立參與者
- **WHEN** 管理者對某會員發起新對話
- **THEN** 系統建立一筆 `Conversation`，並為該管理者與該會員各建立一筆 `ConversationParticipant`

#### Scenario: 管理者回覆時自動加入為參與者
- **WHEN** 尚未是某對話參與者的管理者於該對話回覆
- **THEN** 系統為其建立一筆 `ConversationParticipant`（不影響既有參與者）

### Requirement: 管理後台首頁入口
管理後台首頁 SHALL 新增「站內訊息」功能卡，導向 `/admin/messages`。

#### Scenario: 點擊站內訊息功能卡
- **WHEN** 管理者於管理後台首頁點擊「站內訊息」功能卡
- **THEN** 系統導向 `/admin/messages`

### Requirement: 對話列表頁
`/admin/messages` SHALL 列出所有對話，每筆顯示目標會員顯示名稱、最新訊息內容預覽、最新訊息時間，依最新訊息時間倒序排列；點擊任一筆導向該對話串頁 `/admin/messages/{id}`。任一管理者／superadmin 皆可檢視完整列表（共享可見，非指派制）。

#### Scenario: 列表依最新訊息時間排序
- **WHEN** 管理者開啟 `/admin/messages`
- **THEN** 對話依 `lastMessageAt` 由新到舊排列

#### Scenario: 點擊進入對話串
- **WHEN** 管理者點擊列表中某一筆對話
- **THEN** 系統導向 `/admin/messages/{該對話 id}`

#### Scenario: 尚無任何對話
- **WHEN** 系統尚無任何 `Conversation` 記錄
- **THEN** 列表顯示空狀態提示

### Requirement: 對話串頁與回覆
`/admin/messages/{id}` SHALL 顯示該對話完整訊息記錄（依時間排序），並提供輸入框供管理者回覆。任一管理者／superadmin 皆可回覆任何對話。

#### Scenario: 顯示完整訊息記錄
- **WHEN** 管理者開啟 `/admin/messages/{id}`
- **THEN** 頁面顯示該對話所有訊息，依時間排序，含各則寄件者顯示名稱

#### Scenario: 管理者成功回覆
- **WHEN** 管理者於對話串頁輸入內容（trim 後 1–2000 字）並送出
- **THEN** 系統建立一則 `ConversationMessage`，並更新該對話 `lastMessageAt`

#### Scenario: 管理者送出訊息後通知會員
- **WHEN** 管理者於對話串送出一則訊息
- **THEN** 該對話目前的會員參與者收到「有新訊息」Inbox 通知

### Requirement: 會員詳情頁發起／檢視對話
`/admin/members/{id}` SHALL 新增「站內訊息」分頁：若該會員尚無對話，顯示發送新訊息表單（送出即建立新對話並導向 `/admin/messages/{該新對話 id}`）；若已有對話，顯示「查看完整對話」連結導向 `/admin/messages/{id}`。

#### Scenario: 尚無對話時顯示發起表單
- **WHEN** 管理者開啟某會員詳情頁的「站內訊息」分頁，該會員尚無任何對話
- **THEN** 分頁顯示訊息輸入框與送出按鈕，不顯示既有對話內容

#### Scenario: 發起新對話成功
- **WHEN** 管理者於會員詳情頁「站內訊息」分頁填寫內容並送出
- **THEN** 系統建立新 `Conversation`（含首則訊息）並導向該對話串頁 `/admin/messages/{id}`；目標會員收到「有新訊息」Inbox 通知

#### Scenario: 已有對話時顯示連結
- **WHEN** 管理者開啟某會員詳情頁的「站內訊息」分頁，該會員已有對話
- **THEN** 分頁顯示「查看完整對話」連結，導向 `/admin/messages/{該對話 id}`
