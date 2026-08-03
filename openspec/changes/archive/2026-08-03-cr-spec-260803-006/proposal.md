## Why

`cr-spec-260803-004`（尚未封存，仍在 `spec_apply`）剛把訊息功能從「管理者主動聯繫」擴充為「任何會員互傳」，但仍限定「同一對象間僅一條持續對話」「不做多人群聊」。需求提出人（Justin）現在要求再進一步擴充：同一對象間可以開多筆各自獨立的對話（傳訊息時可選「開新的」或「接續之前的」）、可以邀請其他人加入變成群組討論、可以釘選常用對話、可以自訂對話標題，並讓 Drawer 改為滿版顯示。

經與提出人確認三個關鍵決策：
- **釘選對象是「對話」**（比照 LINE/Messenger 釘選聊天），不是釘選訊息內容。
- **邀請加入討論直接生效，不需要對方同意**（比照 Slack/Teams 內部工具的群組加人模式）。
- **對話標題任一參與者皆可修改**，不設管理員角色分級。

## What Changes

- **多筆對話選擇**：「傳訊息」入口（Topbar／首頁／會員詳情頁）點擊後，若與該對象已有一筆或多筆既有對話，SHALL 先顯示選擇畫面（列出既有對話＋「開新對話」選項），使用者選定後才進入該對話；若尚無任何對話，直接進入建立新對話的畫面（維持現行行為）。
- **多人群組**：任一對話參與者 SHALL 能邀請其他會員直接加入該對話（不需對方同意），成為新的參與者；資料模型本身已是多對多設計（`ConversationParticipant`），本次移除「僅 1:1」的應用層假設，正式支援多人。
- **對話標題**：`Conversation` 新增 `title`（可為空）；任一參與者 SHALL 能修改；未設定時顯示邏輯改為自動組合「除自己外所有參與者名稱」（1:1 沿用對方姓名，群組列出多位、超過 3 位省略為「A、B、C 等 N 人」）。
- **釘選對話**：`ConversationParticipant` 新增 `pinnedAt`；任一參與者 SHALL 能釘選/取消釘選自己視角下的某個對話；頻道列表排序改為「已釘選（依釘選時間倒序）優先，其餘依最新訊息時間倒序」。
- **Drawer 改為滿版**：`MessageDrawer` 由原本右側 `w-3/4 sm:max-w-sm` 小面板改為滿版（`w-full`）；因滿版後不再有可點擊關閉的外部遮罩空間，`DrawerHeader` SHALL 提供明確的關閉按鈕。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `contact-member`：本次是連續第三次修改（001 建立 → 004 大改為任何會員互傳 → 006 本次），新增多筆對話選擇、群組邀請、對話標題、釘選、Drawer 滿版需求，全部疊加於 004 已完成的基礎之上

## Impact

- **Schema**：`prisma/schema/conversation.prisma`——`Conversation` 新增 `title String?`；`ConversationParticipant` 新增 `pinnedAt DateTime?`；純新增欄位，無破壞性變更。
- **Data Layer**（`lib/data/conversation.ts`，大幅調整）：`findOther` 的「恰有一位其他參與者」假設全面替換為「多位其他參與者」邏輯；`ConversationSummary`／`ConversationWithMessages` 型別新增 `displayTitle`／`title`／`isPinned`／`participants`（完整參與者列表，供成員管理 UI）；新增 `findConversationsWithUser(viewerId, targetUserId)`（回傳與該對象共同參與的所有對話，取代原本假設唯一一筆的查找邏輯）。
- **Server Actions**（`app/actions/conversation.ts`）：新增 `inviteToConversation(conversationId, targetSpiritId)`（實作時改以啟動編號查找對象，而非 `targetUserId`——一般會員彼此僅知道對方的啟動編號，不知道內部 UUID）、`updateConversationTitle(conversationId, title)`、`togglePinConversation(conversationId)`、`fetchConversationsWithUser(targetUserId)`（供 Drawer 選擇畫面使用）；`startConversation` 找既有對話的邏輯調整為交由「選擇畫面」決定，不再自動假設唯一對話。
- **UI**：`components/conversation/message-drawer-provider.tsx`（新增「選擇既有對話 vs 開新對話」的中介狀態、成員管理/標題編輯/釘選的呼叫邏輯）、`components/conversation/message-drawer.tsx`（滿版樣式、明確關閉按鈕、選擇畫面、成員列表＋邀請入口、標題編輯 UI、釘選按鈕）。
- **不修改**：`SupportInquiry`（提問管理）、`CourseMessage`（課程 FAQ）——維持與前兩次 CR 一致，三套機制並存。

## Non-Goals（本次明確不做，詳見 design.md）

- 不做群組內的「系統事件訊息」（例如「XXX 已加入」「XXX 已將標題改為...」的自動提示訊息），僅反映在參與者列表／標題本身的即時狀態。
- 不做移除成員／退出群組。
- 不做邀請的權限分級（管理員/一般成員），任一參與者權限一致。
- 不做「已讀回條」（誰已讀、誰未讀的明細），沿用既有的「我是否有未讀」單向邏輯。
