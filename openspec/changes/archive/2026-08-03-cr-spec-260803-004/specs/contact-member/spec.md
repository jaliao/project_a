## REMOVED Requirements

### Requirement: Topbar 站內訊息入口
**Reason**: 訊息功能不再侷限於「會員與管理者對話並導覽至獨立頁面」，改為任何會員互傳、於 Topbar 直接開啟 Drawer，由新的「Topbar 訊息入口」需求取代。
**Migration**: 原本點擊後導向 `/user/{spiritId}/messages` 的行為，改為點擊後直接開啟訊息 Drawer，不再有獨立頁面。

### Requirement: 檢視與管理者的對話串
**Reason**: `/user/{spiritId}/messages` 僅顯示「與管理者的單一對話」，改為 Drawer 顯示「本人參與的所有對話」（任何會員皆可能是對象，非僅管理者），由新的「檢視所有參與的對話」需求取代。
**Migration**: 原頁面功能改由訊息 Drawer 提供，會員可在 Drawer 頻道列表中看到與任何人的對話，不限管理者。

### Requirement: 會員於既有對話中回覆
**Reason**: 會員不再侷限於「僅能在管理者已開啟的既有對話中回覆」，改為任何會員皆可對任何其他會員發起或接續對話，由新的「任何會員發起或接續對話」需求取代。
**Migration**: 會員現在可透過 Topbar「訊息」或任一「傳訊息」入口，對任何會員發起新對話，不再侷限被動回覆。

### Requirement: 會員回覆後通知管理者
**Reason**: 通知對象不再侷限於管理者，改為通知對話中除寄件者外的所有其他參與者（任何身分皆適用），由新的「傳送訊息後通知對方」需求取代。
**Migration**: 通知邏輯泛化為「對話中任何其他參與者皆會收到通知」，管理者僅是其中一種可能的參與者。

## ADDED Requirements

### Requirement: Topbar 訊息入口
Topbar SHALL 對所有登入會員提供「訊息」圖示按鈕，點擊後開啟訊息 Drawer（不導覽至獨立頁面）；若目前有未讀對話，圖示 SHALL 顯示未讀角標。

#### Scenario: 點擊訊息按鈕開啟 Drawer
- **WHEN** 已登入會員點擊 Topbar「訊息」按鈕
- **THEN** 畫面右側滑出訊息 Drawer，顯示頻道列表

#### Scenario: 有未讀對話時顯示角標
- **WHEN** 已登入會員存在至少一個未讀對話
- **THEN** Topbar「訊息」圖示顯示未讀角標（數字或紅點）

#### Scenario: 無未讀對話時不顯示角標
- **WHEN** 已登入會員所有對話皆已讀
- **THEN** Topbar「訊息」圖示不顯示未讀角標

### Requirement: 檢視所有參與的對話
訊息 Drawer SHALL 顯示目前登入使用者參與的所有對話，依最新訊息時間倒序列出頻道列表（對方顯示名稱、頭像、最新訊息預覽、未讀狀態）；點擊任一頻道 SHALL 顯示該對話的完整訊息記錄（依時間排序），並將該對話標記為已讀。

#### Scenario: 頻道列表依最新訊息時間排序
- **WHEN** 使用者開啟訊息 Drawer，且已有多筆對話
- **THEN** 頻道列表依各對話最新訊息時間由新到舊排列

#### Scenario: 未讀頻道有視覺提示
- **WHEN** 某對話有使用者尚未查看過的新訊息
- **THEN** 該頻道於列表中顯示未讀樣式

#### Scenario: 選中頻道顯示訊息記錄並標記已讀
- **WHEN** 使用者點擊頻道列表中某一筆
- **THEN** Drawer 顯示該對話完整訊息記錄，且該對話的未讀狀態清除

#### Scenario: 尚無任何對話時顯示空狀態
- **WHEN** 使用者開啟訊息 Drawer，且尚未參與任何對話
- **THEN** Drawer 顯示空狀態提示，不顯示頻道列表

### Requirement: 任何會員發起或接續對話
任何登入會員 SHALL 能對任何其他會員（不含自己）發起訊息；若雙方已有既有對話，SHALL 視為在既有對話中回覆，不建立新的重複對話；若尚無對話，SHALL 建立新對話並寫入首則訊息。

#### Scenario: 對尚無對話的會員發起新對話
- **WHEN** 會員 A 對從未互傳過訊息的會員 B 送出第一則訊息
- **THEN** 系統建立新對話，寫入該則訊息，A、B 皆成為該對話參與者

#### Scenario: 對已有對話的會員送出訊息視為回覆
- **WHEN** 會員 A 對已有既有對話的會員 B 再次送出訊息
- **THEN** 系統於既有對話中新增訊息，不建立第二條對話

#### Scenario: 不可對自己發起對話
- **WHEN** 會員嘗試對自己發起訊息
- **THEN** 系統拒絕

#### Scenario: 已有對話中僅參與者可送出訊息
- **WHEN** 非該對話參與者的會員嘗試於該對話送出訊息
- **THEN** 系統拒絕並回傳無權限

#### Scenario: 空內容或超過長度上限被拒
- **WHEN** 會員送出空白訊息或超過 2000 字的訊息
- **THEN** 系統拒絕並顯示對應提示，不建立訊息

### Requirement: 傳送訊息後通知對方
會員於對話中送出訊息後，系統 SHALL 通知該對話中除寄件者本人以外的所有其他參與者（Inbox 通知）。

#### Scenario: 送出訊息觸發對方通知
- **WHEN** 會員於對話中送出一則訊息
- **THEN** 該對話中除寄件者外的所有參與者皆收到「有新訊息」Inbox 通知

### Requirement: 資料模型
系統 SHALL 提供 `Conversation`／`ConversationParticipant`／`ConversationMessage` 資料模型：`Conversation` 記錄一段對話（發起人、建立時間、最新訊息時間）；`ConversationParticipant` 為多對多中介表，記錄參與該對話的使用者與其最後查看時間（`lastReadAt`，供未讀判斷）；`ConversationMessage` 記錄每則訊息（寄件者、內容、時間）。本次每個 `Conversation` 恰有兩位參與者（僅支援 1:1，不支援多人群聊）。

#### Scenario: 建立對話時同時建立雙方參與者
- **WHEN** 會員 A 對會員 B 發起新對話
- **THEN** 系統建立一筆 `Conversation`，並為 A、B 各建立一筆 `ConversationParticipant`（`lastReadAt` 初始為 `null`）

#### Scenario: 查看對話後更新最後查看時間
- **WHEN** 會員開啟訊息 Drawer 並選中某頻道
- **THEN** 該會員於該對話的 `ConversationParticipant.lastReadAt` 更新為目前時間

### Requirement: 各頁面「傳訊息」入口
系統 SHALL 於下列頁面提供「傳訊息」入口，點擊後開啟訊息 Drawer 並直接開啟/建立與目標會員的對話：學員專屬頁面（`/user/{spiritId}`）基本資料區塊（僅檢視他人頁面時顯示）；後台會員詳情頁（`/admin/members/{id}`）頁首操作區。

#### Scenario: 學員專屬頁面顯示傳訊息按鈕
- **WHEN** 已登入會員檢視他人的 `/user/{spiritId}`
- **THEN** 基本資料區塊顯示「傳訊息」按鈕

#### Scenario: 本人頁面不顯示傳訊息按鈕
- **WHEN** 已登入會員檢視自己的 `/user/{spiritId}`
- **THEN** 基本資料區塊不顯示「傳訊息」按鈕

#### Scenario: 點擊傳訊息按鈕開啟對應對話
- **WHEN** 會員於任一「傳訊息」入口點擊按鈕
- **THEN** 訊息 Drawer 開啟並直接顯示（或建立）與該目標會員的對話，可直接輸入訊息
