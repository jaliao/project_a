## 1. 資料模型：`Friendship.pinnedAt`

- [x] 1.1 `prisma/schema/friendship.prisma`：`Friendship` 加 `pinnedAt DateTime?`（放 `createdAt` 之後），註解「null=未釘選」
- [x] 1.2 `make schema-update name=add_friendship_pinned_at`（本機 dev 建 migration；新欄位 nullable、相容線上既有資料）→ `20260901091613_add_friendship_pinned_at`，SQL = `ALTER TABLE "friendships" ADD COLUMN "pinnedAt" TIMESTAMP(3);`
- [x] 1.3 確認 `prisma/generated` 重新產生、`prisma migrate status` 乾淨 → `make schema-update` 已回報「database is now in sync」＋「Generated Prisma Client」；host 端 `prisma migrate status` 連不到 `db:5432` 屬既知（DB 走容器內網）

## 2. 資料層：`lib/data/friendship.ts`

- [x] 2.1 檔首註解補一行：`cr-spec-260901-007：FriendListItem 加 pinnedAt / searchText；orderBy 改「釘選優先→加入時間」`
- [x] 2.2 `FriendListItem` 新增：`pinnedAt: Date | null`（`roles` 之後、`addedAt` 之前）、`searchText: string`
- [x] 2.3 `getMyFriends`：`select` 頂層加 `pinnedAt: true`；`select.friend` 已含 `spiritId/realName/englishName/nickname`，無需再加
- [x] 2.4 `getMyFriends`：`orderBy` 改 `[{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]`
- [x] 2.5 `.map` 補：
  - `pinnedAt: r.pinnedAt`
  - `searchText: [r.friend.realName, r.friend.englishName, r.friend.nickname, r.friend.spiritId].filter(Boolean).join(' ').toLowerCase()`
- [x] 2.6 `isFriend` 不動

## 3. Server Action：`app/actions/friendship.ts`

- [x] 3.1 新增 `togglePinFriend(friendUserId: string): Promise<ActionResponse>`：
  - `auth()` 驗證登入
  - `prisma.friendship.findUnique({ where: { ownerId_friendId: { ownerId: me, friendId: friendUserId } }, select: { pinnedAt: true } })`
  - 查無 → `{ success: false, message: '找不到該好友' }`
  - `prisma.friendship.update({ where: { ownerId_friendId: {...} }, data: { pinnedAt: row.pinnedAt ? null : new Date() } })`
  - `revalidatePath('/messages')`；回 `{ success: true }`
- [x] 3.2 `fetchMyFriends` / `removeFriend` / `addFriendBySpiritId` 不動（`fetchMyFriends` 回傳型別隨 `FriendListItem` 擴充自動更新）

## 4. 元件：`components/community/friends-list.tsx`

- [x] 4.1 檔首註解補 `cr-spec-260901-007`：性別文字→`GenderIcon`、上方名稱／編號搜尋、每頁 50 筆換頁、卡片可釘選
- [x] 4.2 import：加 `GenderIcon`（`@/components/shared/gender-icon`）、`Input`（`@/components/ui/input`）、`IconPin`／`IconPinFilled`（`@tabler/icons-react`）、`useMemo`／`useEffect`；加 `togglePinFriend`（`@/app/actions/friendship`）
- [x] 4.3 移除 `nameWithGender` 三元字串；名稱列改為 `<div className="flex items-center gap-1 min-w-0"><GenderIcon gender={f.gender} /><p className="truncate text-sm font-medium">{f.displayName}</p></div>`；`t('genderMale')`／`t('genderFemale')` 於本檔不再使用（保留 i18n key）
- [x] 4.4 搜尋：`const [query, setQuery] = useState('')`；`const q = query.trim().toLowerCase()`；`const filtered = useMemo(() => q ? friends.filter(f => f.searchText.includes(q)) : friends, [friends, q])`
- [x] 4.5 分頁：`const PAGE_SIZE = 50`；`const [page, setPage] = useState(1)`；搜尋重設頁碼改於 `Input` `onChange`（`handleQueryChange` 同時 `setQuery` + `setPage(1)`）——lint 規則 `react-hooks/set-state-in-effect` 禁止在 effect 內 setState，故不用 `useEffect`；`totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))`；`pageClamped = Math.min(page, totalPages)`；`pageItems = filtered.slice((pageClamped-1)*PAGE_SIZE, pageClamped*PAGE_SIZE)`
- [x] 4.6 版面順序：搜尋 `<Input placeholder={t('searchPlaceholder')} value={query} onChange=... className="mb-3" />` → 格狀（`pageItems.map`）→ 換頁列
- [x] 4.7 換頁列（僅 `filtered.length > PAGE_SIZE` 時顯示）：`上一頁`（`disabled={pageClamped<=1}`，`onClick={() => setPage(p => Math.max(1, p-1))}`，label `t('prevPage')`）／`t('pageIndicator', { page: pageClamped, total: totalPages })`／`下一頁`（`disabled={pageClamped>=totalPages}`，`onClick={() => setPage(p => p+1)}`，label `t('nextPage')`）
- [x] 4.8 空狀態分兩種：`friends.length === 0` → 既有 `t('friendsEmpty')`；`friends.length > 0 && filtered.length === 0` → `t('searchEmpty')`（同 `rounded-lg border p-10 text-center text-sm text-muted-foreground` 樣式），搜尋框仍渲染於上方
- [x] 4.9 卡片功能列（`mt-auto flex gap-2`）加釘選鈕（置「傳訊息」左側或右側）：`<Button variant="ghost" size="sm" aria-label={f.pinnedAt ? t('unpin') : t('pin')} title=... disabled={pinningId === f.userId} onClick={() => handleTogglePin(f.userId)}>{f.pinnedAt ? <IconPinFilled className="h-4 w-4 text-primary" /> : <IconPin className="h-4 w-4" />}</Button>`
- [x] 4.10 `const [pinningId, setPinningId] = useState<string | null>(null)`；`handleTogglePin` 比照 `handleRemove`：set→`await togglePinFriend(userId)`→clear→成功 `onRemoved()`（沿用同一 reload 回呼，語意為「清單有變更」；不改 prop 名以縮小 diff）→失敗 `toast.error(result.message)`
- [x] 4.11 「傳訊息」按鈕 `onClick={() => onOpenConversation(f.userId)}` 不動（行為改由 `messages-page.tsx` `openWithUser` 決定，見 §5）
- [x] 4.12 props 簽章（`friends` / `onOpenConversation` / `onRemoved`）不變；375px 手機單欄卡片三顆鈕不換行溢出（`傳訊息` `flex-1`、釘選／刪除 `size="sm"`）

## 5. 元件：`components/conversation/messages-page.tsx`（傳訊息直接開最近對話、移除 picker）

- [x] 5.1 檔首註解補 `cr-spec-260901-007`：`openWithUser` 改「有既有對話→直接開最後訊息時間最新的一筆」，移除既有對話選擇畫面
- [x] 5.2 `openWithUser` 改寫：`const candidates = await fetchConversationsWithUser(targetUserId)`；`candidates.length === 0` → `startNewWithTarget(targetUserId)`；否則 `const latest = [...candidates].sort((a,b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())[0]; selectConversation(latest.id)`
- [x] 5.3 移除 state：`pickingTargetUserId`、`pickingCandidates`、`isPicking`；移除 `clearPicking`（及 `selectConversation`／`startNewWithTarget` 內的 `clearPicking()` 呼叫）
- [x] 5.4 移除 handlers：`handlePickExisting`、`handlePickNew`
- [x] 5.5 移除右側渲染的 `isPicking ? (…) :` 整段 JSX（「選擇既有對話 ／ 開新對話」區塊），保留 `selected ? (對話內容) : (選頻道提示)` 兩分支
- [x] 5.6 保留 `startNewWithTarget`／`startConversation`／`fetchPreviewNewConversation`（no-conversation 情境仍用）
- [x] 5.7 `useEffect([initialWithUserId])` 不動（仍呼叫 `openWithUser`）；`selectConversation` 仍 `setMobileShowThread(true)`，手機點「傳訊息」直接顯示對話串
- [x] 5.8 `ConversationMembersDialog` 仍收完整 `friends`（未受影響）
- [x] 5.9 檢查 `t('pickerHint')`／`t('startNewConversation')`／`t('selectChannelHint')` 是否還有其他使用者；`pickerHint`／`startNewConversation` 若僅此處用，i18n key 可保留不刪（tasks 註記）

## 6. 手機送出訊息後版面不被捲出（bug fix）

- [x] 6.1 root cause（原始碼定位，無需瀏覽器）：`@shadcn/react/message-scroller` 的所有捲動皆走 `viewport.scrollTo({top})`（不呼叫 `Element.scrollIntoView()`），且 viewport 已 `overscroll-contain` → **不是**「自動捲動外溢 document」。真因＝面板 `h-[calc(100dvh-13rem)]` 只扣 13rem，但實際外框（Topbar `h-16`=4rem＋`main` `py-6`=3rem＋頁首 ~2.75rem＋`TabsList` ~3.25rem＋`Footer` `py-4`+文字 ~3rem）≒ 16rem，導致「訊息」頁籤整頁高 ≈ `100dvh + 3rem` → 外層 document 可捲 ~3rem，送出後視野被帶離輸入框。桌機用 `100vh-16rem`（扣對）故無此症。
- [x] 6.2 修正 A（收斂捲動）：確認即可——primitive 僅動自身 viewport `scrollTop`、`MessageScrollerViewport` 已帶 `overscroll-contain`（`components/ui/message-scroller.tsx`），捲動不外溢祖先，無需改 `conversation-thread.tsx`
- [x] 6.3 修正 B（高度鏈，本次採用）：`messages-page.tsx`「訊息」`TabsContent` 面板手機高度 `h-[calc(100dvh-13rem)]` → `h-[calc(100dvh-16rem)]`（與桌機 `sm:h-[calc(100vh-16rem)]` 對齊實際外框），使「訊息」頁籤下 document 不再溢出可捲。桌機 `sm:` 分支與所有互動未動；未動 layout `main`／`messages/page.tsx`（最小改動）
- [x] 6.4 送出成功後不主動 `focus()` `Textarea`：`conversation-thread.tsx` `handleSend` 成功僅 `setBody('')`，本就無 `focus()` 呼叫 → 不需改
- [ ] 6.5 迴歸（人工實測）：桌機（`≥ sm`）雙欄外框、返回鍵、選字複製、進入對話自動捲最新、送出貼齊底部、「回到最新訊息」鈕皆與既有一致；手機 `test2` 對話送出後 document 不下捲、輸入框與 Footer 仍可見

## 7. i18n

- [x] 7.1 `messages/zh-TW.json` `community` 新增：`searchPlaceholder`「搜尋名稱或啟動編號」、`searchEmpty`「查無符合的好友」、`pin`「釘選」、`unpin`「取消釘選」、`pageIndicator`「第 {page} / {total} 頁」、`prevPage`「上一頁」、`nextPage`「下一頁」
- [x] 7.2 `messages/en.json` `community` 補對應英文（Search by name or ID／No matching friends／Pin／Unpin／Page {page} / {total}／Previous／Next）
- [x] 7.3 `genderMale`／`genderFemale` 保留不刪
- [x] 7.4 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`，確認新 key 有簡體

## 8. 驗證

- [x] 8.1 `npx eslint prisma/schema components/community/friends-list.tsx components/conversation/messages-page.tsx components/conversation/conversation-thread.tsx lib/data/friendship.ts app/actions/friendship.ts`：0 error
- [x] 8.2 `npx tsc --noEmit`：0 error（`FriendListItem` 擴充後 `messages-page.tsx` / `page.tsx` / `ConversationMembersDialog` 仍編譯通過）
- [x] 8.3 `npm run build`：`✓ Compiled successfully`
- [ ] 8.4 **（人工實測）** 好友卡片：性別以 `GenderIcon` 圖示呈現（男藍♂／女玫瑰♀／未設定中性），無「（男／女）」文字
- [ ] 8.5 **（人工實測）** 好友搜尋：輸入姓名片段／啟動編號片段（含大小寫、空白）即時篩選；清空還原並回第 1 頁；有好友但無結果顯示「查無符合的好友」
- [ ] 8.6 **（人工實測）** 分頁：好友 > 50 筆時每頁 50、換頁正常、頁次指示正確、首末頁按鈕停用；≤ 50 筆不顯示換頁
- [ ] 8.7 **（人工實測）** 釘選：卡片點釘選 → 置頂（釘選區依釘選時間新到舊）；取消釘選 → 回加入時間排序；跨搜尋與分頁排序一致；對方無通知、對方清單不變
- [ ] 8.8 **（人工實測）** 「傳訊息」：與對象已有多筆對話 → 直接開最後訊息時間最新的一筆（無選擇畫面）；無對話 → 新對話畫面；學員專頁 / 後台會員詳情 / `?with=` 深連結 / 好友卡片行為一致
- [ ] 8.9 **（人工實測）** bug fix：`test2` 對話手機寬度送出訊息成功 → 對話串捲到最新、輸入框與 Footer 仍完整可見、頁面未整體下捲；桌機版面與行為不變
- [ ] 8.10 **（人工實測）** 迴歸：加好友 Drawer、移除好友、非好友互傳訊息、`?tab=`、對話成員彈窗「從好友加入」皆正常

## 9. 文件與版本號

- [x] 9.1 `doc/學員手冊.md`〈十五、社群〉：
  - 好友頁籤：性別由「顯示名稱（性別）」文字改為「名稱旁以性別圖示（♂／♀）顯示」；新增「上方可用名稱或啟動編號搜尋」「每頁 50 位、可換頁」「可釘選常用好友（釘選的排最前面）」
  - 「傳訊息」描述：「已有對話會先讓您選擇…」→「已聊過的會直接開啟最近一次的對話視窗」
  - 訊息頁籤：補「送出訊息後畫面只會捲動對話內容，輸入框與頁尾維持在畫面內」
  - 檔首版本標註＋日期改當日
- [x] 9.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：同步好友頁籤與「傳訊息」入口行為描述（如有相關章節）；檔首版本＋日期同步（rule 9）
- [x] 9.3 `config/version.json`：patch +1、`updatedAt` = 當日
- [x] 9.4 `ai-context/03-architecture.md`：`lib/data/friendship.ts` `getMyFriends` 補 `pinnedAt`／`searchText` 與新排序；`Friendship.pinnedAt`；社群「好友」頁籤搜尋／分頁／釘選；「傳訊息」入口改「直接開最近對話」
- [x] 9.5 `ai-context/07-current-tasks.md`「已完成」最前面追加 `cr-spec-260901-007 社群功能小優化（性別圖示／傳訊息直開最近對話／好友搜尋／50 筆換頁／釘選／手機送出捲動修正）`
- [x] 9.6 `README-AI.md`：版本行更新
