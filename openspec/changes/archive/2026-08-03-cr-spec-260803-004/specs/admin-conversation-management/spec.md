## REMOVED Requirements

### Requirement: 資料模型
**Reason**: 訊息系統不再是管理者專屬功能，`Conversation`／`ConversationParticipant`／`ConversationMessage` 資料模型定義搬至 `contact-member` capability（新增 `lastReadAt` 欄位，詳見該 capability 新增的「資料模型」需求）。
**Migration**: 無資料遷移，僅 capability 歸屬調整；資料表結構延續使用，另新增 `ConversationParticipant.lastReadAt`。

### Requirement: 管理後台首頁入口
**Reason**: 管理者不再有訊息相關的特殊管理功能，後台首頁不需要「站內訊息」功能卡；一般訊息功能改由 Topbar「訊息」入口（`contact-member`）提供，管理者與一般會員共用同一套。
**Migration**: 管理者透過 Topbar「訊息」圖示或會員詳情頁「傳訊息」按鈕使用訊息功能。

### Requirement: 對話列表頁
**Reason**: `/admin/messages` 列表頁提供的「任一管理者可檢視所有對話」已與提出人確認移除；改由訊息 Drawer（`contact-member`）僅顯示使用者本人參與的對話。
**Migration**: 管理者若要查看自己參與的對話，改用 Topbar「訊息」開啟 Drawer。

### Requirement: 對話串頁與回覆
**Reason**: `/admin/messages/{id}` 獨立對話串頁面移除，改由訊息 Drawer 內嵌顯示與回覆，不再需要專屬路由。
**Migration**: 於 Drawer 內選擇對應頻道即可檢視與回覆，功能等價。

### Requirement: 會員詳情頁發起／檢視對話
**Reason**: 會員詳情頁「站內訊息」分頁（含發起新對話表單、查看完整對話連結）改為單一「傳訊息」按鈕，觸發訊息 Drawer 並直接開啟/建立與該會員的對話（見 `contact-member` 新增的「各頁面傳訊息入口」需求）。
**Migration**: 原分頁功能由頁首「傳訊息」按鈕取代，操作結果等價（開啟/建立對話、可直接輸入送出）。
