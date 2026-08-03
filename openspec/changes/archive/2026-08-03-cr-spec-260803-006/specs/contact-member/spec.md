## MODIFIED Requirements

### Requirement: 資料模型
系統 SHALL 提供 `Conversation`／`ConversationParticipant`／`ConversationMessage` 資料模型：`Conversation` 記錄一段對話（發起人、可選標題、建立時間、最新訊息時間）；`ConversationParticipant` 為多對多中介表，記錄參與該對話的使用者、其最後查看時間（`lastReadAt`，供未讀判斷）與釘選時間（`pinnedAt`，供釘選排序）；`ConversationMessage` 記錄每則訊息（寄件者、內容、時間）。一個 `Conversation` SHALL 可有兩位以上參與者（支援群組討論），不再限定僅 1:1。

#### Scenario: 建立對話時同時建立參與者
- **WHEN** 會員 A 對會員 B 發起新對話
- **THEN** 系統建立一筆 `Conversation`，並為 A、B 各建立一筆 `ConversationParticipant`（`lastReadAt`、`pinnedAt` 初始為 `null`）

#### Scenario: 查看對話後更新最後查看時間
- **WHEN** 會員開啟訊息 Drawer 並選中某頻道
- **THEN** 該會員於該對話的 `ConversationParticipant.lastReadAt` 更新為目前時間

#### Scenario: 對話可有多位參與者
- **WHEN** 一段對話透過邀請新增了第三位參與者
- **THEN** 系統允許該 `Conversation` 存在兩筆以上 `ConversationParticipant`，不視為錯誤

### Requirement: 任何會員發起或接續對話
任何登入會員 SHALL 能對任何其他會員（不含自己）發起訊息。與同一對象之間 SHALL 可存在多筆各自獨立的對話；建立訊息時 SHALL 明確指定要建立新對話，或於指定的既有對話中回覆，系統 SHALL NOT 自動猜測要接續哪一筆既有對話。

#### Scenario: 建立全新對話
- **WHEN** 會員 A 明確選擇「開新對話」並對會員 B 送出訊息
- **THEN** 系統建立新的 `Conversation`，即使 A、B 之間已有其他既有對話

#### Scenario: 於指定既有對話中回覆
- **WHEN** 會員於某筆既有對話中送出訊息
- **THEN** 系統於該對話中新增訊息，不建立新對話

#### Scenario: 不可對自己發起對話
- **WHEN** 會員嘗試對自己發起訊息
- **THEN** 系統拒絕

#### Scenario: 已有對話中僅參與者可送出訊息
- **WHEN** 非該對話參與者的會員嘗試於該對話送出訊息
- **THEN** 系統拒絕並回傳無權限

#### Scenario: 空內容或超過長度上限被拒
- **WHEN** 會員送出空白訊息或超過 2000 字的訊息
- **THEN** 系統拒絕並顯示對應提示，不建立訊息

### Requirement: 各頁面「傳訊息」入口
系統 SHALL 於下列頁面提供「傳訊息」入口：學員專屬頁面（`/user/{spiritId}`）基本資料區塊（僅檢視他人頁面時顯示）；後台會員詳情頁（`/admin/members/{id}`）頁首操作區。點擊後，若與目標會員尚無任何既有對話，SHALL 直接開啟訊息 Drawer 並進入建立新對話的畫面；若已有一筆以上既有對話，SHALL 先顯示選擇畫面（列出既有對話，並提供「開新對話」選項），待使用者選定後才顯示對應對話內容。

#### Scenario: 學員專屬頁面顯示傳訊息按鈕
- **WHEN** 已登入會員檢視他人的 `/user/{spiritId}`
- **THEN** 基本資料區塊顯示「傳訊息」按鈕

#### Scenario: 本人頁面不顯示傳訊息按鈕
- **WHEN** 已登入會員檢視自己的 `/user/{spiritId}`
- **THEN** 基本資料區塊不顯示「傳訊息」按鈕

#### Scenario: 尚無對話時直接進入新對話畫面
- **WHEN** 會員於「傳訊息」入口點擊，且與目標會員尚無任何既有對話
- **THEN** 訊息 Drawer 開啟並直接顯示可輸入送出的新對話畫面

#### Scenario: 已有對話時顯示選擇畫面
- **WHEN** 會員於「傳訊息」入口點擊，且與目標會員已有一筆以上既有對話
- **THEN** 訊息 Drawer 開啟並顯示選擇畫面，列出所有既有對話與「開新對話」選項

#### Scenario: 選擇既有對話後接續顯示
- **WHEN** 會員於選擇畫面點選某一筆既有對話
- **THEN** Drawer 顯示該對話的完整訊息記錄，可直接回覆

#### Scenario: 選擇畫面點擊開新對話
- **WHEN** 會員於選擇畫面點擊「開新對話」
- **THEN** Drawer 顯示可輸入送出的新對話畫面（與該目標會員之間再建立一筆獨立對話）

### Requirement: 檢視所有參與的對話
訊息 Drawer SHALL 顯示目前登入使用者參與的所有對話，頻道列表排序 SHALL 為：已釘選的對話優先（依釘選時間新到舊），其餘依最新訊息時間倒序；每筆列表項目顯示對話顯示標題（自訂標題或自動組合的參與者名稱）、頭像（1:1 對話顯示對方頭像，群組對話顯示通用群組圖示）、最新訊息預覽、未讀狀態。點擊任一頻道 SHALL 顯示該對話的完整訊息記錄（依時間排序），並將該對話標記為已讀。

#### Scenario: 釘選對話優先顯示
- **WHEN** 使用者有一筆釘選對話與數筆未釘選對話
- **THEN** 頻道列表最上方顯示該筆釘選對話，其餘依最新訊息時間排列在後

#### Scenario: 未讀頻道有視覺提示
- **WHEN** 某對話有使用者尚未查看過的新訊息
- **THEN** 該頻道於列表中顯示未讀樣式

#### Scenario: 選中頻道顯示訊息記錄並標記已讀
- **WHEN** 使用者點擊頻道列表中某一筆
- **THEN** Drawer 顯示該對話完整訊息記錄，且該對話的未讀狀態清除

#### Scenario: 尚無任何對話時顯示空狀態
- **WHEN** 使用者開啟訊息 Drawer，且尚未參與任何對話
- **THEN** Drawer 顯示空狀態提示，不顯示頻道列表

#### Scenario: 群組對話顯示通用圖示
- **WHEN** 某對話參與者超過 2 位
- **THEN** 該對話於頻道列表顯示通用群組圖示，非任一成員的個人頭像

## ADDED Requirements

### Requirement: 邀請加入對話
任一對話參與者 SHALL 能邀請其他會員直接加入該對話，被邀請人 SHALL NOT 需要同意即成為新的參與者。

#### Scenario: 成功邀請新成員
- **WHEN** 對話參與者邀請一位尚未加入的會員
- **THEN** 系統將該會員加入為新的參與者，其可立即檢視並回覆該對話

#### Scenario: 被邀請人收到通知
- **WHEN** 會員被邀請加入某對話
- **THEN** 該會員收到「已被加入對話」的 Inbox 通知

#### Scenario: 重複邀請已是參與者的會員
- **WHEN** 邀請一位已經是該對話參與者的會員
- **THEN** 系統視為成功（不重複新增、不報錯）

#### Scenario: 非參與者不可邀請他人加入
- **WHEN** 非該對話參與者的會員嘗試邀請他人加入
- **THEN** 系統拒絕並回傳無權限

### Requirement: 修改對話標題
任一對話參與者 SHALL 能修改該對話的標題；標題清空時 SHALL 恢復為自動組合參與者名稱的顯示方式。

#### Scenario: 成功修改標題
- **WHEN** 對話參與者輸入新標題並儲存
- **THEN** 該對話的自訂標題更新，所有參與者的頻道列表與對話內皆顯示新標題

#### Scenario: 清空標題恢復自動命名
- **WHEN** 對話參與者將標題清空並儲存
- **THEN** 系統恢復顯示自動組合的參與者名稱，不再顯示自訂標題

#### Scenario: 非參與者不可修改標題
- **WHEN** 非該對話參與者的會員嘗試修改標題
- **THEN** 系統拒絕並回傳無權限

### Requirement: 釘選對話
任一對話參與者 SHALL 能釘選或取消釘選自己視角下的某個對話；此為個人化設定，不影響其他參與者看到的順序。

#### Scenario: 釘選對話
- **WHEN** 對話參與者將某對話釘選
- **THEN** 該對話於此使用者的頻道列表中優先顯示於未釘選對話之上

#### Scenario: 取消釘選對話
- **WHEN** 對話參與者將已釘選的對話取消釘選
- **THEN** 該對話回到依最新訊息時間排序的位置

#### Scenario: 釘選為個人化設定
- **WHEN** 會員 A 釘選某對話
- **THEN** 該對話的其他參與者頻道列表排序不受影響

### Requirement: Drawer 滿版顯示與明確關閉方式
訊息 Drawer SHALL 以滿版寬度顯示；Drawer SHALL 提供明確可見的關閉按鈕，不依賴滿版後可能不存在的外部點擊區域關閉。

#### Scenario: Drawer 滿版顯示
- **WHEN** 使用者開啟訊息 Drawer
- **THEN** Drawer 佔滿可視寬度顯示內容

#### Scenario: 點擊關閉按鈕關閉 Drawer
- **WHEN** 使用者點擊 Drawer 內明確的關閉按鈕
- **THEN** Drawer 關閉，回到原本頁面
