## Why

社群「訊息」頁籤的群組對話目前只能加入、無法離開——一旦被邀請進群組（或自己建立群組後不想再參與），沒有任何方式可以退出，只能放著不管、持續收到該群組的新訊息通知。學員需要能主動離開不想再參與的聊天群組。

## What Changes

- 在對話成員彈窗（`ConversationMembersDialog`）新增「離開群組」操作：僅當該對話目前參與者**超過 2 人**（即為群組對話）時顯示，點擊需先確認才會離開。
- 離開後，系統移除該使用者在此對話的 `ConversationParticipant` 記錄；對話本身、訊息記錄與其他參與者不受影響（訊息保留、其他人視角看不到任何變化，除了該成員清單少一人）。
- 離開者自己的頻道列表中，該對話即消失；若離開時正在檢視該對話，畫面回到未選取狀態。
- 一對一對話（參與者恰為 2 人）**不提供**「離開」（本次需求範圍限定於「聊天群組」）；若群組因成員陸續離開而剩下 2 人，即視為一般一對一對話，不再提供離開操作（與現有系統對「1:1 對話」與「群組對話」的既有區分一致）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `contact-member`：新增「離開聊天群組」需求——群組對話（參與者 > 2 人）的任一參與者可自行離開，離開後移除自己的參與者記錄，不影響對話與其他成員；一對一對話不提供此操作

## Impact

- **Server Actions**：`app/actions/conversation.ts` 新增 `leaveConversation(conversationId)`（驗證為參與者、驗證目前參與者數 > 2、刪除本人 `ConversationParticipant`）。
- **UI**：`components/conversation/conversation-members-dialog.tsx` 成員清單下方新增「離開群組」按鈕（`AlertDialog` 確認），僅 `participants.length > 2` 時顯示；`components/conversation/messages-page.tsx` 新增 `handleMembersLeft` 回呼——離開成功後關閉彈窗、取消選取該對話、重新整理頻道列表。
- **i18n**：`messages/zh-TW.json`／`messages/en.json` 的 `conversation` 命名空間新增「離開群組」相關文案（按鈕、確認彈窗、成功／失敗提示）。
- **無 schema 變更**（沿用既有 `ConversationParticipant` 模型，僅刪除列）。
- 不影響現有「檢視所有參與的對話」「任何會員發起或接續對話」「邀請加入對話」等既有 `contact-member` 需求。
