## 1. 新元件：`components/conversation/conversation-members-dialog.tsx`（client）

- [x] 1.1 檔首標準註解（`2026-09-01`、`cr-spec-260901-006`：對話成員／邀請加入彈窗）＋ `'use client'`
- [x] 1.2 props：`{ open, onOpenChange, conversationId?: number, participants: { userId; name; avatarUrl }[], friends: FriendListItem[], onInvited: () => void }`；`import type { FriendListItem } from '@/lib/data/friendship'`
- [x] 1.3 `Dialog` / `DialogContent`（`className="max-w-sm"`）/ `DialogHeader` / `DialogTitle`＝`t('membersTitle')`；`useTranslations('conversation')`
- [x] 1.4 **成員清單**：`participants.map` → `flex items-center gap-2`（`UserAvatar avatarUrl={p.avatarUrl} displayName={p.name} size="sm"` ＋ `<span className="text-sm">{p.name}</span>`），外層 `max-h-48 overflow-y-auto`
- [x] 1.5 **加入成員區**（`conversationId != null` 才 render）：`<p className="text-sm font-medium">{t('addMember')}</p>` ＋ 切換鈕 `flex gap-1`：兩顆 `Button size="sm"`，`variant={mode === 'friends' ? 'default' : 'outline'}` / 反之，文字 `t('addByFriend')` / `t('addBySpiritId')`；`const [mode, setMode] = useState<'friends' | 'spiritId'>('friends')`
- [x] 1.6 `const participantIds = new Set(participants.map((p) => p.userId))`
- [x] 1.7 `mode === 'friends'`：搜尋 `Input`（`value={q}`、`placeholder={t('friendSearchPlaceholder')}`）；`invitable = friends.filter((f) => f.spiritId && !participantIds.has(f.userId))`；`shown = invitable.filter((f) => f.displayName.toLowerCase().includes(q.trim().toLowerCase()))`；`invitable.length === 0` → `t('noFriendsToAdd')`；否則 `shown.length === 0` → `t('noFriendMatch')`；否則 `max-h-56 overflow-y-auto` 清單，每列 `<button type="button" onClick={() => handleInvite(f.spiritId!)} disabled={busy}>`（頭像＋`f.displayName`）
- [x] 1.8 `mode === 'spiritId'`：`Input`（`value={spiritIdInput}`、`placeholder={t('invitePlaceholder')}`）＋ `<Button size="icon" variant="outline" onClick={() => handleInvite(spiritIdInput.trim())} disabled={busy || !spiritIdInput.trim()}>` `IconUserPlus`
- [x] 1.9 `handleInvite(spiritId: string)`：`if (!conversationId || !spiritId) return`；`setBusy(true)` → `inviteToConversation(conversationId, spiritId)`（`@/app/actions/conversation`）→ `setBusy(false)`；成功 `toast.success(t('inviteSuccess'))` ＋ 清空 `q`／`spiritIdInput` ＋ `onInvited()`（不關 Dialog）；失敗 `toast.error(result.message ?? t('inviteFail'))`
- [x] 1.10 `const [busy, setBusy] = useState(false)`；`import { toast } from 'sonner'`、`IconUserPlus`（`@tabler/icons-react`）、`Button`、`Input`、`UserAvatar`

## 2. `components/conversation/messages-page.tsx`

- [x] 2.1 移除 state `inviteInput` / `inviteLoading` 與函式 `handleInviteSubmit`
- [x] 2.2 移除「對話資訊子區塊」內的**成員 chips 列**（`<div className="flex flex-wrap items-center gap-2">…participants.map…</div>`）與**邀請列**（`{selected.id && (<div className="flex gap-2"><Input …invitePlaceholder… /><Button …IconUserPlus… /></div>)}`）
- [x] 2.3 標題列 else 分支：釘選鈕之後、`sm:hidden` 返回鍵之前，新增 `{selected.id && (<Button size="icon" variant="ghost" className="size-8" aria-label={t('membersTitle')} title={t('membersTitle')} onClick={() => setMembersOpen(true)}><IconUsers className="h-4 w-4" /></Button>)}`（`IconUsers` 已 import）
- [x] 2.4 新增 `const [membersOpen, setMembersOpen] = useState(false)`
- [x] 2.5 `selected` 分支容器內渲染 `<ConversationMembersDialog open={membersOpen} onOpenChange={setMembersOpen} conversationId={selected.id} participants={selected.participants} friends={friends} onInvited={handleMembersInvited} />`；`import { ConversationMembersDialog } from './conversation-members-dialog'`
- [x] 2.6 `const handleMembersInvited = useCallback(async () => { if (!selected?.id) return; setSelected(await fetchConversationMessages(selected.id)); refreshConversations() }, [selected?.id, refreshConversations])`
- [x] 2.7 import 清理：`inviteToConversation` 若 `messages-page.tsx` 內已無其他用途則自 `@/app/actions/conversation` 的 import 移除；`Input` 若仍用於 `editingTitle` 則保留
- [x] 2.8 檔首註解補一行：`cr-spec-260901-006：成員清單與邀請加入改由標題列「成員」按鈕開啟的 Dialog（桌機/手機一致），標題區不再行內顯示成員 chips 與邀請框`

## 3. i18n（`conversation` 命名空間）

- [x] 3.1 `messages/zh-TW.json` 新增：`membersTitle`「對話成員」、`addMember`「加入成員」、`addByFriend`「從好友加入」、`addBySpiritId`「輸入啟動編號」、`friendSearchPlaceholder`「搜尋好友名稱」、`noFriendMatch`「沒有符合的好友」、`noFriendsToAdd`「沒有可加入的好友」
- [x] 3.2 `messages/en.json` 補對應英文（`Conversation members` / `Add member` / `From friends` / `By Spirit ID` / `Search friends by name` / `No matching friend` / `No friends available to add`）
- [x] 3.3 沿用既有 `invitePlaceholder`／`inviteSuccess`／`inviteFail`，不改
- [x] 3.4 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`

## 4. 驗證

- [x] 4.1 `npx eslint components/conversation/messages-page.tsx components/conversation/conversation-members-dialog.tsx`：0 error
- [x] 4.2 `npx tsc --noEmit`：0 error
- [x] 4.3 `npm run build`：`✓ Compiled successfully`
- [x] 4.4 **（人工實測）** 桌機／手機：對話標題列右側有「成員」按鈕，標題下方**不再**有成員 chips 與邀請輸入框
- [x] 4.5 **（人工實測）** 「成員」按鈕開啟 Dialog：成員清單正確列出所有參與者
- [x] 4.6 **（人工實測）** Dialog「輸入啟動編號」：輸入有效編號 → 加入成功、通知對方、成員清單更新；無效編號 → 錯誤 toast
- [x] 4.7 **（人工實測）** Dialog「從好友加入」：輸入名字即時過濾；已在對話中的好友不出現；點一位 → 加入成功、成員清單更新；無符合 → `noFriendMatch`；無可加入好友 → `noFriendsToAdd`
- [x] 4.8 **（人工實測）** 1 對 1 對話邀第 3 人成群組後，頻道列表顯示群組圖示、標題自動組合；`?tab=` / `?with=` / 對話串 / 釘選 / 改標題不受影響；`en` 語系 Dialog 文案為英文

## 5. 文件與版本號

- [x] 5.1 `doc/學員手冊.md`〈十五、社群〉「訊息頁籤」段：補「對話標題列右側『成員』按鈕開啟彈窗，可查看成員、以啟動編號或從好友清單搜尋加入新成員」；檔首版本＋日期改當日
- [x] 5.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：無訊息頁籤操作章節，內容不動；檔首版本＋日期同步（比照 rule 9）
- [x] 5.3 `config/version.json`：patch +1、`updatedAt` = 當日
- [x] 5.4 `ai-context/03-architecture.md`：訊息頁籤條目補「成員／邀請改 Dialog（`conversation-members-dialog.tsx`，桌機/手機一致；加入＝好友搜尋／啟動編號切換）」
- [x] 5.5 `ai-context/07-current-tasks.md`「已完成」最前面追加 `cr-spec-260901-006 社群訊息頁面修正`
- [x] 5.6 `README-AI.md`：版本行更新
