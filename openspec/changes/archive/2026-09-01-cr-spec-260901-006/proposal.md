## Why

需求單 CR-SPEC-260901-006（提出人：廖柏嘉 Justin，2026-09-01）：**「社群訊息頁面修正」**。原文：

- 在手機版，訊息成員和邀請加入的功能不要出現在標題下方，節省空間，把成員功能改用彈跳視窗，放在右上角。
- 增加成員除了使用編號，也可以透過好友名單加入，下拉選單？或是輸入名字搜尋？

使用者澄清（2026-09-01）：
- **桌機、手機都改成彈窗（統一）**：不分螢幕，成員清單與邀請加入一律收進「成員」按鈕開啟的 Dialog；對話標題下方不再有成員 chips 與邀請輸入框。
- **加入成員 UI＝搜尋框＋啟動編號輸入切換**：Dialog 內同時提供「從好友搜尋」（輸入名字即時過濾好友清單，點一位即加入）與「輸入啟動編號」兩種方式，以切換鈕互切。

現況（`components/conversation/messages-page.tsx`「訊息」頁籤，`selected` 對話的「對話資訊子區塊」）：

- 標題列：標題 ＋ 鉛筆（改標題）＋ 釘選 ＋（手機）返回鍵。
- 標題列下方**成員 chips 列**（`selected.participants.map` → 頭像＋名字的圓角標籤，永遠顯示）。
- 再下方**邀請列**（`selected.id &&`）：`Input`（placeholder `invitePlaceholder`「輸入對方啟動編號邀請加入」）＋ `IconUserPlus` 送出鈕 → `inviteToConversation(selected.id, inviteInput)`。
- `inviteToConversation(conversationId, targetSpiritId)`（`app/actions/conversation.ts`）：以 `spiritId.trim().toUpperCase()` 解析會員，加入為參與者、發「已被加入對話」通知，`isParticipant` 檢查冪等、非參與者無權限。

本 CR ＝**把成員 chips 列與邀請列從對話標題區移除，改由標題列右側「成員」按鈕開啟的 Dialog 承載**；Dialog 內邀請加入除既有「輸入啟動編號」外，新增「從好友清單搜尋加入」。伺服器端 `inviteToConversation` 不動（好友加入時傳該好友的 `spiritId`）。對話串、頻道列表、「好友」頁籤、加好友 Drawer、`?with=` / `?tab=` 皆不變。

## What Changes

### 1. 新元件：`components/conversation/conversation-members-dialog.tsx`（client）

以 `components/ui/dialog.tsx` 實作。props：`{ open, onOpenChange, conversationId?: number, participants: { userId; name; avatarUrl }[], friends: FriendListItem[], onInvited: () => void }`。

- **標題**：`t('membersTitle')`「對話成員」。
- **成員清單**：列出 `participants`（頭像＋名字），唯讀（沿用現況——無移除成員功能）。
- **加入成員區**（僅 `conversationId` 存在時顯示）：`mode: 'friends' | 'spiritId'` state（預設 `'friends'`），以兩顆切換鈕互切：
  - **從好友搜尋**（`t('addByFriend')`）：搜尋 `Input`（`t('friendSearchPlaceholder')`）＋ 下方即時過濾的好友清單（`friends` 中排除已是 `participants` 的 userId、以 `displayName` 不分大小寫比對）；每列頭像＋名字，點一列 → `inviteToConversation(conversationId, friend.spiritId)` → 成功 toast（`inviteSuccess`）＋ `onInvited()`。無符合 → `t('noFriendMatch')`；可加入的好友為空 → `t('noFriendsToAdd')`。`spiritId` 為 null 的好友該列停用（理論上不會發生）。
  - **輸入啟動編號**（`t('addBySpiritId')`）：沿用既有 `Input`（`invitePlaceholder`）＋ 送出鈕 → `inviteToConversation(conversationId, input.trim())`；成功清空、toast、`onInvited()`；失敗 `toast.error(result.message ?? inviteFail)`。
- 邀請進行中以 local loading state 停用對應按鈕。

### 2. `components/conversation/messages-page.tsx`

- 移除「對話資訊子區塊」內的**成員 chips 列**與**邀請列**（連同 `inviteInput` / `inviteLoading` state 與 `handleInviteSubmit`）。
- 標題列（`flex items-center gap-2`）在釘選鈕之後、（手機）返回鍵之前，新增一顆「**成員**」按鈕（`IconUsers`，`variant="ghost" size="icon" className="size-8"`，`aria-label`/`title` = `t('membersTitle')`）→ `setMembersOpen(true)`。`selected` 存在即顯示（含尚未建立的新對話預覽，此時 Dialog 只顯示成員清單、無加入區）。
- 新增 state `const [membersOpen, setMembersOpen] = useState(false)`。
- 在 `selected` 分支內渲染 `<ConversationMembersDialog open={membersOpen} onOpenChange={setMembersOpen} conversationId={selected.id} participants={selected.participants} friends={friends} onInvited={handleMembersInvited} />`。
- `handleMembersInvited`：`if (selected?.id) { setSelected(await fetchConversationMessages(selected.id)); refreshConversations() }`（比照原 `handleInviteSubmit` 成功後的刷新）。
- 對話資訊子區塊改動後只剩標題列——保留容器 class（`space-y-2 border-b pb-3 sm:rounded-lg sm:border sm:p-3`）不動，內容自然精簡。

### 3. i18n（`conversation` 命名空間）

`messages/zh-TW.json` 新增：`membersTitle`「對話成員」、`addMember`「加入成員」、`addByFriend`「從好友加入」、`addBySpiritId`「輸入啟動編號」、`friendSearchPlaceholder`「搜尋好友名稱」、`noFriendMatch`「沒有符合的好友」、`noFriendsToAdd`「沒有可加入的好友」。`messages/en.json` 補對應英文。沿用既有 `invitePlaceholder`／`inviteSuccess`／`inviteFail`。`npm run gen:zh-cn` 重產簡體。

### 4. 文件與版本號

- `doc/學員手冊.md`〈十五、社群〉「訊息頁籤」段：補「對話標題列右側『成員』按鈕開啟彈窗，可查看成員、以啟動編號或從好友清單搜尋加入新成員」。檔首版本＋日期。
- `doc/老師手冊.md`／`doc/管理者操作手冊.md`：無訊息頁籤操作細節章節 → 內容不動；檔首版本比照 rule 9 同步。
- `config/version.json`：patch +1、`updatedAt` 當日。
- `ai-context/03-architecture.md`（訊息頁籤：成員／邀請改 Dialog、新元件 `conversation-members-dialog.tsx`）、`ai-context/07-current-tasks.md`（「已完成」最前面追加本 CR）；`README-AI.md` 版本行。

## Capabilities

### Modified Capabilities

- `contact-member`：「邀請加入對話」需求擴充——邀請他人加入對話的操作 SHALL 收進由對話標題列右側「成員」按鈕開啟的彈窗（Dialog，桌機與手機一致），對話標題區 SHALL NOT 於行內顯示成員標籤列與邀請輸入框；彈窗內 SHALL 提供成員清單，並可用「輸入啟動編號」或「從好友清單搜尋選取」兩種方式邀請新成員（兩者皆走既有邀請機制：免同意、發通知、冪等、非參與者無權限）。

## Impact

- **Affected code**：
  - 新增：`components/conversation/conversation-members-dialog.tsx`
  - 修改：`components/conversation/messages-page.tsx`、`messages/zh-TW.json`／`messages/en.json`（＋產生 `zh-CN.json`）、`doc/學員手冊.md`（＋另二手冊檔首）、`config/version.json`、`ai-context/03`／`07`、`README-AI.md`
  - 不動：`app/actions/conversation.ts`（`inviteToConversation` 不變，好友加入傳該好友 `spiritId`）、`components/conversation/conversation-thread.tsx`、`components/community/*`、`app/[locale]/(user)/messages/page.tsx`、`lib/data/*`、`prisma/schema/*`
- **Database**：無。
- **Dependencies / Route access / 權限**：皆不變（邀請授權仍由 `inviteToConversation` 的 `isParticipant` 判定）。
- **i18n**：`conversation` 命名空間新增 7 個 key；沿用既有邀請相關文案。

## Open Questions

- 無。UI 形式（成員／邀請一律收進「成員」彈窗、桌機手機一致；加入成員＝好友搜尋＋啟動編號輸入切換）已由使用者確認。「從好友加入」複用既有 `inviteToConversation`（傳好友 `spiritId`）、不新增 server action 為實作決定。
