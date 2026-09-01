## Context

現況（`components/conversation/messages-page.tsx`，`selected` 對話的「對話資訊子區塊」，`components/conversation/`）：

- 容器：`<div className="space-y-2 border-b pb-3 sm:rounded-lg sm:border sm:p-3">`（cr-spec-260901-004 定案，手機僅底線、`sm:` 完整卡片框）。
- **標題列** `<div className="flex items-center gap-2">`：
  - `editingTitle` → `Input` ＋ `IconCheck` 存檔鈕；否則 → 標題 `<p className="flex-1 truncate">` ＋ `IconPencil`（`startEditTitle`）＋ 釘選鈕（`IconPin`/`IconPinFilled`，`handleTogglePin`）。
  - 末端 `sm:hidden` 返回鍵（`IconArrowLeft` → `setMobileShowThread(false)`，cr-spec-260901-004）。
- **成員 chips 列** `<div className="flex flex-wrap items-center gap-2">`：`selected.participants.map((p) => <div class="…rounded-full bg-muted px-2 py-1"><UserAvatar size="sm" /><span>{p.name}</span></div>)`。**永遠顯示**。
- **邀請列**（`selected.id &&`）`<div className="flex gap-2">`：`Input`（`value={inviteInput}`，placeholder `t('invitePlaceholder')`）＋ `<Button size="icon" variant="outline">` `IconUserPlus`（`onClick={handleInviteSubmit}`，`disabled={inviteLoading || !inviteInput.trim()}`）。
- state：`inviteInput` / `inviteLoading`；`handleInviteSubmit()` → `inviteToConversation(selected.id, inviteInput.trim())` → 成功 `toast.success(t('inviteSuccess'))` ＋ 清空 ＋ `setSelected(await fetchConversationMessages(selected.id))` ＋ `refreshConversations()`；失敗 `toast.error(result.message ?? t('inviteFail'))`。

伺服器：`inviteToConversation(conversationId: number, targetSpiritId: string)`（`app/actions/conversation.ts`）——`auth()` → `isParticipant(conversationId, me)` 否則「無權限」→ `prisma.user.findUnique({ where: { spiritId: targetSpiritId.trim().toUpperCase() } })` 查無「找不到該啟動編號對應的會員」→ 自己「無法邀請自己」→ 非參與者則 `conversationParticipant.create` ＋ fire-and-forget `createNotification(target.id, '已被加入對話', …)` → `{ success, message, conversationId }`。**冪等**（已是參與者不重複新增）。

資料：`selected.participants: { userId: string; name: string; avatarUrl: string | null }[]`（`ConversationParticipantInfo`，`lib/data/conversation.ts`）。`friends: FriendListItem[]`（`{ userId, spiritId: string | null, displayName, avatarUrl, gender, unitLabel, roles, addedAt }`，cr-spec-260901-005 擴充）已是 `MessagesPage` state（`initialFriends` ＋ `fetchMyFriends` 重整）。

UI 元件：`components/ui/dialog.tsx`（`Dialog` / `DialogTrigger` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogFooter`）、`select.tsx`、`popover.tsx`、`scroll-area.tsx` 皆已存在；**無** `command`／`combobox`。

## Goals / Non-Goals

**Goals：**
- 對話標題區不再行內顯示成員 chips 與邀請輸入框（桌機、手機一致）——標題區只剩標題列。
- 標題列右側新增「成員」按鈕 → 開啟 Dialog：內含成員清單 ＋ 加入成員（「從好友搜尋」／「輸入啟動編號」切換）。
- 「從好友搜尋」：輸入名字即時過濾好友清單，點一位即加入（走既有 `inviteToConversation`，傳好友 `spiritId`）。

**Non-Goals：**
- 不改 `inviteToConversation` 或任何 server action、不新增 API。
- 不加「移除成員」功能（現況本來就沒有）。
- 不改對話串、頻道列表、標題編輯、釘選、「好友」頁籤、加好友 Drawer、`?with=` / `?tab=`。
- 不動 `prisma/schema/*`、`lib/data/*`、`messages/page.tsx`。
- 不做群組對話的其他管理功能（本 CR 僅版面 + 邀請入口）。

## Decisions

### D1：新元件 `components/conversation/conversation-members-dialog.tsx`

```tsx
type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: number          // 新對話預覽時 undefined → 不顯示「加入成員」區
  participants: { userId: string; name: string; avatarUrl: string | null }[]
  friends: FriendListItem[]
  onInvited: () => void            // 邀請成功後由父層重抓 selected + conversations
}
```

- `Dialog` + `DialogContent`（`className="max-w-sm"`）+ `DialogHeader`/`DialogTitle`（`t('membersTitle')`）。
- **成員清單**：`participants.map` → `flex items-center gap-2`（`UserAvatar size="sm"` ＋ `<span className="text-sm">{p.name}</span>`）。以 `max-h-48 overflow-y-auto` 包住（沿用 `scroll-area` 或純 `overflow-y-auto`；取後者較輕）。
- **加入成員區**（`conversationId != null` 才 render）：
  - 標題 `<p className="text-sm font-medium">{t('addMember')}</p>`。
  - 切換鈕：`<div className="flex gap-1">` 兩顆 `Button size="sm"`，`variant={mode === x ? 'default' : 'outline'}`——`addByFriend` / `addBySpiritId`。`mode` state 預設 `'friends'`。
  - `mode === 'friends'`：
    - 搜尋 `Input`（`value={q}`，`placeholder={t('friendSearchPlaceholder')}`）。
    - `const invitable = friends.filter(f => f.spiritId && !participantIds.has(f.userId))`；`const shown = invitable.filter(f => f.displayName.toLowerCase().includes(q.trim().toLowerCase()))`。
    - `invitable.length === 0` → `<p className="text-sm text-muted-foreground">{t('noFriendsToAdd')}</p>`；否則 `shown.length === 0` → `t('noFriendMatch')`；否則清單：每列 `<button onClick={() => handleInvite(f.spiritId!)}>`（頭像＋名字），`max-h-56 overflow-y-auto`。
  - `mode === 'spiritId'`：`Input`（`value={spiritIdInput}`，`placeholder={t('invitePlaceholder')}`）＋ `<Button onClick={() => handleInvite(spiritIdInput.trim())} disabled={busy || !spiritIdInput.trim()}>`（`IconUserPlus` ＋ `t('addMember')` 或純圖示）。
  - `handleInvite(spiritId: string)`：`if (!conversationId || !spiritId) return`；`setBusy(true)` → `const r = await inviteToConversation(conversationId, spiritId)` → `setBusy(false)`；`r.success` → `toast.success(t('inviteSuccess'))` ＋ 清空 `q`/`spiritIdInput` ＋ `onInvited()`（不自動關 Dialog——可連續加多人）；否則 `toast.error(r.message ?? t('inviteFail'))`。
- `useTranslations('conversation')`。`participantIds = new Set(participants.map(p => p.userId))`。

### D2：`messages-page.tsx` 改動

- **移除** state `inviteInput` / `inviteLoading` 與函式 `handleInviteSubmit`；`import` 移除不再直接使用的（`inviteToConversation` 移到新元件；`messages-page` 內若無其他用途則自 import 拿掉）。
- **移除** 成員 chips 列（`<div className="flex flex-wrap items-center gap-2">…</div>`）與邀請列（`{selected.id && (<div className="flex gap-2">…</div>)}`）。
- 標題列 else 分支，釘選鈕之後、`sm:hidden` 返回鍵之前，插入：
  ```tsx
  {selected.id && (
    <Button
      size="icon"
      variant="ghost"
      className="size-8"
      aria-label={t('membersTitle')}
      title={t('membersTitle')}
      onClick={() => setMembersOpen(true)}
    >
      <IconUsers className="h-4 w-4" />
    </Button>
  )}
  ```
  （`IconUsers` 已 import。`editingTitle` 分支不加——與鉛筆/釘選一致，編輯標題時該列是 Input+勾。）
- 新 state `const [membersOpen, setMembersOpen] = useState(false)`。
- `selected` 分支容器內（`<div className="flex min-h-0 flex-1 flex-col gap-3">` 之內、`<ConversationThread>` 之後或 sibling）渲染：
  ```tsx
  <ConversationMembersDialog
    open={membersOpen}
    onOpenChange={setMembersOpen}
    conversationId={selected.id}
    participants={selected.participants}
    friends={friends}
    onInvited={handleMembersInvited}
  />
  ```
- `const handleMembersInvited = useCallback(async () => {
    if (!selected?.id) return
    setSelected(await fetchConversationMessages(selected.id))
    refreshConversations()
  }, [selected?.id, refreshConversations])`

### D3：切換鈕 vs 其他形式

採「兩顆 `Button` 切換」而非 `Tabs`——與 `AddFriendDrawer`（cr-spec-260901-003）的 `view: 'qr'|'scan'` 兩鈕切換一致，且 Dialog 內不宜再套一層 `Tabs`（視覺過重）。名字搜尋採「`Input` ＋ 就地過濾清單」而非 `Popover` combobox——專案無 `command` 元件，且 Dialog 內清單直接展開比 Popover 疊 Popover 穩定。

### D4：「從好友加入」複用 `inviteToConversation`

好友加入時傳 `friend.spiritId`（`FriendListItem` 已含）。`inviteToConversation` 內部 `spiritId.trim().toUpperCase()` 解析、冪等、發通知——與「輸入啟動編號」完全同一條路徑，零 server 改動。`spiritId` 為 `null` 的好友（實務上不存在——所有正式會員皆有）於清單過濾掉（`f.spiritId &&`）。

## Risks / Trade-offs

- **少了「一眼看到成員」**：成員 chips 從標題區移入 Dialog，需多一次點擊才看到完整成員。符合 CR「節省空間」訴求；1 對 1 對話標題本身即對方名字，群組對話標題已是成員名稱組合，資訊不致遺失。
- **好友清單可能很大**：`overflow-y-auto` ＋ 名字過濾即可；不做分頁。
- **好友非會員邊界**：`friends` 只含正式會員（`Friendship.friendId` FK），`spiritId` 必有；`f.spiritId &&` 僅為型別保險。
- **連續邀請**：`handleInvite` 成功後不關 Dialog，方便一次加多人；使用者手動關閉。
- **新對話預覽（`!selected.id`）**：Dialog 只顯示成員清單、不顯示加入區；「成員」按鈕該情境不顯示（`selected.id &&`），與原邀請列 gating 一致。

## Migration Plan

無資料庫 / 無資料遷移。純前端。部署即生效。回滾＝還原 `messages-page.tsx`、刪除新元件、移除新增 i18n key、`config/version.json` 回退。

## Open Questions

無。
