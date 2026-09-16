## Why

社群「訊息」對話成員彈窗目前只支援「加入成員」與「離開群組」（僅限自己離開），沒有任何方式可以把別人移出群組對話——若加錯人、或成員不再需要留在群組，只能請對方自行離開，無法由其他參與者代為處理。

經與使用者確認：對話參與者之間完全平等（無群組管理員／擁有者概念，`Conversation.createdById` 僅為發起人記錄、未用於任何權限判斷），因此「移除成員」的權限採**任一參與者皆可移除其他任一參與者**；比照既有「離開群組」規則，**僅群組（目前參與者 > 2 人）**提供此功能，一對一對話不適用。

## What Changes

- 「成員」彈窗的成員清單，於**群組對話**（目前參與者 > 2 人）時，每一列**除自己以外**的參與者旁新增「移除」按鈕；點擊後跳出確認提示，確認後將該參與者移出對話。
- 新增 Server Action `removeConversationParticipant(conversationId, targetUserId)`（`app/actions/conversation.ts`，緊鄰既有 `leaveConversation`）：驗證操作者為該對話參與者；拒絕移除自己（提示改用「離開群組」）；僅當目前參與者數 > 2 時允許（比照 `leaveConversation` 的群組門檻）；刪除目標使用者的 `ConversationParticipant` 記錄；fire-and-forget 發送「已被移出對話」站內通知給被移除者（比照既有「已被加入對話」通知風格）。
- `ConversationMembersDialog` 的 `onInvited` callback 重新命名為語意更通用的 `onMembersChanged`（加入成員、移除成員皆呼叫同一個「刷新成員清單」回呼，行為與原本加入成員後的刷新一致：重新抓取對話內容＋刷新頻道列表，**不**關閉彈窗、**不**取消選取，與「離開群組」需要關閉彈窗＋取消選取的行為不同故維持獨立的 `onLeft`）。

## Capabilities

### Modified Capabilities
- `contact-member`：新增「移除對話成員」需求（ADDED，緊鄰既有「邀請加入對話」「離開聊天群組」需求）

## Impact

- **Server Actions**：`app/actions/conversation.ts` 新增 `removeConversationParticipant`。
- **元件**：`components/conversation/conversation-members-dialog.tsx` 成員清單列新增移除按鈕與確認流程；新增 `currentUserId: string` prop（判斷哪些列不顯示移除按鈕）；`onInvited` prop 重新命名為 `onMembersChanged`。
- **呼叫端**：`components/conversation/messages-page.tsx` 傳入既有的 `currentUserId`（已存在於該元件 props，無需新查詢）給 `ConversationMembersDialog`；`onInvited={handleMembersInvited}` 改為 `onMembersChanged={handleMembersInvited}`（函式本身不改名，僅 prop 名稱調整）。
- **i18n**：`messages/zh-TW.json`／`en.json` 的 `conversation` 命名空間新增 `removeMember`／`removeConfirm`／`removeConfirmNo`／`removeSuccess`／`removeFail`，`npm run gen:zh-cn` 重新產生 `zh-CN`。
- 不影響 Prisma schema／migration（沿用既有 `ConversationParticipant` 表，僅新增一個 `delete` 操作，比照既有 `removeFriend`／`leaveConversation` 的模式）；不影響一對一對話與現有的加入成員／離開群組行為。
