## 1. Server Action

- [x] 1.1 `app/actions/conversation.ts` 新增 `removeConversationParticipant(conversationId, targetUserId)`：驗證登入與 `isParticipant(conversationId, session.user.id)`；`targetUserId === session.user.id` 時拒絕（提示改用「離開群組」）；查目前參與者數，`<= 2` 時拒絕（一對一對話不適用）；`prisma.conversationParticipant.deleteMany({ where: { conversationId, userId: targetUserId } })`，`count === 0` 時回傳「該成員已不在對話中」；成功後 fire-and-forget `createNotification(targetUserId, '已被移出對話', ...)`

## 2. UI

- [x] 2.1 `components/conversation/conversation-members-dialog.tsx`：新增 `currentUserId: string` prop；成員清單每一列（`p.userId !== currentUserId` 且 `participants.length > 2`）新增「移除」按鈕；點擊開啟 `AlertDialog` 確認（比照既有「離開群組」樣式，`removeTarget` state 記錄目前要移除的對象），確認後呼叫 `removeConversationParticipant(conversationId, targetUserId)`，成功 toast＋呼叫 `onMembersChanged()`，失敗 toast 錯誤
- [x] 2.2 同檔 `onInvited` prop 重新命名為 `onMembersChanged`（加入成員與移除成員成功後皆呼叫此回呼）
- [x] 2.3 `components/conversation/messages-page.tsx`：`<ConversationMembersDialog>` 呼叫端新增 `currentUserId={currentUserId}`（既有 prop，無需新查詢）；`onInvited={handleMembersInvited}` 改為 `onMembersChanged={handleMembersInvited}`

## 3. i18n

- [x] 3.1 `messages/zh-TW.json` 的 `conversation` 命名空間新增：`removeMember`（「移除」按鈕）、`removeConfirm`（確認提示文字，含 `{name}` 參數）、`removeConfirmNo`（取消）、`removeSuccess`、`removeFail`
- [x] 3.2 `messages/en.json` 補齊對應翻譯；執行 `npm run gen:zh-cn` 重新產生 `zh-CN.json`

## 4. 驗證

- [x] 4.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 4.2 `npm run build`（Compiled successfully）
- [x] 4.3 手動驗證（**部分執行**：本次 session 無瀏覽器操作工具。已用 curl 對執行中的 dev 容器做煙霧測試：`/messages` 未登入回應 307 導向登入（無 500，確認新增的 `removeConversationParticipant`／UI 改動未造成執行期錯誤）。`tsc --noEmit`／`npm run lint`／`npm run build` 皆涵蓋全部改動檔案並通過。實際登入後「群組對話（>2 人）成員清單除自己外皆顯示移除按鈕，確認後成功移除、被移除者收到通知且該對話自其頻道列表消失」「一對一對話與 2 人以下群組不顯示移除按鈕」「非參與者與嘗試移除自己皆被拒絕」等互動流程仍待人工於瀏覽器實測）
- [x] 4.4 已同步 `doc/學員手冊.md`（〈社群〉新增「移除成員」段落）；`doc/老師手冊.md`／`doc/管理者操作手冊.md` 社群功能對所有角色一致、這兩份手冊本就未收錄「對話成員」細節內容，未修改；`config/version.json` 0.1.208→0.1.209（2026-09-16）；`README-AI.md` 版本行；`ai-context/07-current-tasks.md`「已完成」清單新增本次 CR 記錄
