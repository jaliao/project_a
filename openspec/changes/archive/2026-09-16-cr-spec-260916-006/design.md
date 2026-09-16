## Context

`Conversation` 模型沒有任何「群組管理員／擁有者」概念：`createdById` 只是建立對話當下的發起人記錄（`app/actions/conversation.ts` `startConversation` 建立時寫入），從未在任何權限判斷中被讀取——`inviteToConversation`／`leaveConversation`／`sendConversationMessage` 皆只檢查「呼叫者是否為該對話目前的參與者」（`isParticipant`），對所有參與者一視同仁。經與使用者確認，「移除成員」延續此平等模型：任一參與者皆可移除任一其他參與者，不新增角色概念。

既有「離開群組」（`leaveConversation`）已經是「僅群組（>2 人）可用、刪除一筆 `ConversationParticipant`、不影響對話與訊息本身」的完整範例，本次「移除成員」在邏輯上幾乎是它的鏡像（差別只在目標是「別人」而非「自己」），可直接比照其結構實作。

## Goals / Non-Goals

- Goals：任一參與者可將群組中的其他任一參與者移出對話；一對一對話不提供此操作。
- Non-Goals：不新增群組管理員／擁有者角色或任何差異化權限（已與使用者確認採完全平等模型）；不支援一次移除多人（比照既有互動皆為單一目標的操作粒度，如「加入成員」「離開群組」）；不新增操作紀錄／稽核 LOG（社群訊息模組目前沒有任何操作紀錄機制，`AdminActionLog` 僅用於後台管理操作，非本次範圍）。

## Decisions

### 1. `removeConversationParticipant` 比照 `leaveConversation` 的結構，而非比照課程「移除學員」
課程側的 `removeStudentFromInvite` 需要**必填移除原因**並寫入 `AdminActionLog`（後台稽核情境）；社群訊息模組沒有對應的稽核需求與 UI 慣例，比照套用會顯得突兀且無實際用途。改為比照同模組內既有的 `leaveConversation`：無需填寫原因，僅需一次確認提示，刪除後 fire-and-forget 通知被移除者（比照 `inviteToConversation` 的「已被加入對話」通知風格，新增對等的「已被移出對話」通知）。

### 2. 群組門檻（>2 人）比照 `leaveConversation`，於 action 內以「移除前」的參與者數判斷
`leaveConversation` 的既有規格明訂「一對一對話（參與者恰為 2 人）SHALL NOT 提供離開；群組因成員離開而降至 2 人以下時，即不再提供離開」。`removeConversationParticipant` 採相同判斷時機與門檻：**移除前**參與者數必須 > 2 才允許移除（移除後至少剩 2 人，仍是有效對話，不會產生「1 人對話」的異常狀態）。UI 端同樣以「目前參與者數 > 2」決定要不要渲染移除按鈕，與離開按鈕共用同一個門檻判斷（`participants.length > 2`）。

### 3. 拒絕移除自己，導引改用既有「離開群組」
`removeConversationParticipant(conversationId, targetUserId)` 若 `targetUserId === session.user.id` 直接回傳錯誤（訊息導引使用者改用「離開群組」）。維持「移除別人」與「移除自己（離開）」兩個語意清楚分離的 action，避免單一 action 承擔兩種不同前置條件與 UI 行為（離開需要關閉彈窗＋取消選取，移除別人則否，見決策 4）。UI 上也不會在自己那一列顯示移除按鈕（`currentUserId` 比對），從入口就避免這個情境發生，action 內的檢查是最後一道防線。

### 4. `onInvited` 重新命名為 `onMembersChanged`，移除成功後重用同一回呼（不新增 `onRemoved`）
比較「加入成員」與「移除成員」在 UI 上要做的事——重新抓取目前選中對話的最新內容（`fetchConversationMessages`）＋刷新頻道列表——完全相同，都**不**關閉彈窗、**不**取消選取（使用者仍在檢視/管理同一個對話）。這與「離開群組」不同（`onLeft` 需要關閉彈窗＋取消選取，因為使用者自己已不再是該對話的參與者）。與其新增一個內容重複的 `onRemoved` prop，不如把語意已經是「成員異動、請刷新」的 `onInvited` 重新命名為 `onMembersChanged`，兩種成功情境共用同一個回呼；`messages-page.tsx` 端只需把 prop 名稱換掉，呼叫的 `handleMembersInvited` 函式本身邏輯不變（維持函式原名，避免不必要的大改動——若日後想更精準命名可另外處理，非本次必要範圍）。

## Risks / Trade-offs

- 「任一參與者皆可移除任一其他參與者」在多人群組中可能出現「A 移除 B 之後，B 自己也可以再把 A 移除」的來回拉扯情境（完全平等模型的必然結果，非本次引入的新風險，使用者已知悉並選擇此設計）；若未來需要更嚴謹的群組治理（例如僅發起人可移除他人），需另開票單引入角色概念，屬既有 `createdById` 尚未被使用之權限判斷的未來擴充空間。
- 移除通知採 fire-and-forget（比照既有「已被加入對話」通知），若通知寫入失敗只記錄於伺服器日誌，不影響移除操作本身的成功結果。

## Migration Plan

無資料庫 schema 變更，沿用既有 `ConversationParticipant` 表。純新增一個 Server Action 與對應 UI，不影響任何既有資料或既有功能的行為。
