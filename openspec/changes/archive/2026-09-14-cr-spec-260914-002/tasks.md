## 1. Server Action

- [x] 1.1 `app/actions/conversation.ts` 新增 `leaveConversation(conversationId)`：`auth()` 驗證登入；`isParticipant` 驗證呼叫者為參與者，否則回傳無權限；查詢目前參與者總數，`<= 2` 則拒絕（`message: '此非群組對話，無法離開'`）；否則 `prisma.conversationParticipant.delete`（呼叫者自己那筆）

## 2. UI - 成員彈窗

- [x] 2.1 `components/conversation/conversation-members-dialog.tsx` 成員清單下方新增「離開群組」按鈕（`variant="ghost" text-destructive`），僅 `participants.length > 2 && conversationId != null` 時顯示
- [x] 2.2 「離開群組」包 `AlertDialog` 確認（比照 `friends-list.tsx` 的「刪除」確認模式）
- [x] 2.3 新增 `onLeft: () => void` prop，確認離開後呼叫 `leaveConversation`，成功則 `toast.success` 並呼叫 `onLeft()`，失敗則 `toast.error(result.message ?? t('leaveFail'))`

## 3. UI - 訊息頁面整合

- [x] 3.1 `components/conversation/messages-page.tsx` 新增 `handleMembersLeft`：關閉成員彈窗（`setMembersOpen(false)`）、`setSelected(null)`（回到未選取狀態）、`refreshConversations()`
- [x] 3.2 `<ConversationMembersDialog>` 傳入 `onLeft={handleMembersLeft}`

## 4. i18n

- [x] 4.1 `messages/zh-TW.json` 的 `conversation` 命名空間新增：`leaveGroup`（離開群組按鈕文案）、`leaveConfirm`（確認提示）、`leaveConfirmNo`（取消文案）、`leaveSuccess`、`leaveFail`
- [x] 4.2 補齊 `messages/en.json` 對應翻譯；執行 `npm run gen:zh-cn` 產生簡體

## 5. 驗證

- [x] 5.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 5.2 `npm run build`（Compiled successfully，TypeScript 無錯誤；建置時的 `Can't reach database server at db` 為 host 端建置無法連容器內網 DB 的預期訊息，與本次改動無關）
- [ ] 5.3 手動驗證：3 人以上群組任一成員可離開＋離開後頻道列表與畫面狀態正確；1:1 對話不顯示離開按鈕；群組降到 2 人後不再顯示離開按鈕；非參與者呼叫 action 被拒絕（**未執行**：本次 session 無瀏覽器操作工具，未實際登入點過「離開群組」流程，僅確認 `npm run build`／TypeScript 通過，`/messages` 未登入時正常導向 `/login` 無 500）
- [x] 5.4 依 CLAUDE.md 規範同步 `doc/學員手冊.md`〈十五、社群〉「對話成員」段落補充「離開群組」說明（v0.1.200；`doc/老師手冊.md`／`doc/管理者操作手冊.md` 社群功能無角色專屬差異且本無此細節內容，未修改）、`config/version.json`（0.1.199→0.1.200）、`README-AI.md` 版本行、`ai-context/07-current-tasks.md` 新增本次 CR 記錄
