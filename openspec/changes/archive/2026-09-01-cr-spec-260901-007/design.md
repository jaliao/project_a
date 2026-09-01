## Context

現況重點（cr-spec-260901-003 / 004 / 005 已封存並上線）：

- **`lib/data/friendship.ts`**
  ```ts
  export type FriendListItem = {
    userId: string; spiritId: string | null; displayName: string
    avatarUrl: string | null; gender: Gender
    unitLabel: string | null; roles: UserRole[]; addedAt: Date
  }
  export async function getMyFriends(userId: string): Promise<FriendListItem[]>
  // where { ownerId: userId }, orderBy { createdAt: 'desc' }
  // select.friend: id, spiritId, avatarKey, image, realName, englishName,
  //   nickname, displayNameMode, gender, roles, churchType, churchOther, church{name}
  ```
  `displayName = getMemberDisplayName(friend)`（依 `displayNameMode` 取 realName／englishName／nickname）。

- **`app/actions/friendship.ts`**：`addFriendBySpiritId` / `removeFriend(friendUserId)` / `fetchMyFriends()`（= `getMyFriends(me)`）。`ActionResponse = { success; message?; friendUserId?; alreadyFriend? }`。

- **`components/community/friends-list.tsx`**（client）：props `{ friends: FriendListItem[]; onOpenConversation: (userId) => void; onRemoved: () => void }`。`grid gap-3 sm:grid-cols-2 lg:grid-cols-3`；每張卡 `flex flex-col gap-3 rounded-lg border p-4`：頭像＋`nameWithGender`（`f.displayName（男/女）`）＋`spiritId`；`unitLabel ?? '—'`；`roles.map` → `<Badge>`；底部 `mt-auto flex gap-2`：「傳訊息」`<Button variant="outline">` → `onOpenConversation(f.userId)`、「刪除」`<AlertDialog>`（`removeFriend` → `onRemoved`）。`useTranslations('community' | 'common' | 'role')`。空狀態 `rounded-lg border p-10 text-center` `t('friendsEmpty')`。

- **`components/conversation/messages-page.tsx`**（client）：
  - `friends` state（`initialFriends`），`reloadFriends = async () => setFriends(await fetchMyFriends())`。
  - `<TabsContent value="friends"><FriendsList friends onOpenConversation={(uid) => { changeTab('messages'); openWithUser(uid) }} onRemoved={reloadFriends} /></TabsContent>`。
  - `friends` 也傳給 `<ConversationMembersDialog … friends={friends} />`（「從好友加入」邀請搜尋 — **需要完整清單**）。
  - `openWithUser(targetUserId)`：`const candidates = await fetchConversationsWithUser(targetUserId)`；`candidates.length === 0` → `startNewWithTarget`；否則 `setPickingTargetUserId` / `setPickingCandidates` / `setMobileShowThread(true)`。
  - picker JSX：`isPicking` 分支渲染「`pickerHint` ＋ `pickingCandidates.map` 每筆 `handlePickExisting(c.id)` ＋ 底部 `startNewConversation` 鈕 `handlePickNew`」。
  - `?with=` → `useEffect([initialWithUserId])` → `openWithUser(initialWithUserId)`。
  - `handleSend` 成功後 `setSelected(await fetchConversationMessages(result.conversationId))` ＋ `refreshConversations()`。
  - 「訊息」`TabsContent` 面板：`<div className="flex h-[calc(100dvh-13rem)] min-h-[24rem] overflow-hidden sm:h-[calc(100vh-16rem)] sm:min-h-[28rem] sm:rounded-lg sm:border">`。

- **`components/conversation/conversation-thread.tsx`**（client）：`<div className="flex min-h-0 flex-1 flex-col gap-4">` → `MessageScrollerProvider > MessageScroller(flex-1 min-h-0) > Viewport(p-4) > Content > Item(scrollAnchor = 最後一則)` ＋ `MessageScrollerButton`；其下 `<div className="flex gap-2">` `Textarea rows=2` ＋ 送出 `<Button>`。`key={selected.id ?? …}` 由父層指定 → 換對話即整棵重掛。

- **`ConversationSummary`**（`lib/data/conversation.ts`）：含 `id: number`、`lastMessageAt: Date`、`isPinned`、`displayTitle`、`lastMessagePreview`…。`findConversationsWithUser` 回傳未特別排序（`getConversationSummaries` 後 client 端依 pinned→`lastMessageAt desc` 排；但 `fetchConversationsWithUser` 直接回 `getConversationSummaries` 結果，順序不保證）。

- **`components/shared/gender-icon.tsx`**：`export type Gender = 'male' | 'female' | 'unspecified'`；`<GenderIcon gender />` → `IconGenderMale`（`text-blue-500`）／`IconGenderFemale`（`text-rose-500`）／`IconGenderAgender`（`text-muted-foreground/50`），皆 `size-4 shrink-0` ＋ `aria-label`。`FriendListItem.gender` 型別為 Prisma `Gender` enum（值同 `'male'|'female'|'unspecified'`），可直接傳入。

- **`Friendship`**（`prisma/schema/friendship.prisma`）：`id Int @id @default(autoincrement())` / `ownerId String @db.Uuid` / `friendId String @db.Uuid` / `owner` `friend` 關聯（`onDelete: Cascade`）/ `createdAt DateTime @default(now())` / `@@unique([ownerId, friendId])` / `@@index([ownerId])` / `@@map("friendships")`。

- **後台會員搜尋參考**（`lib/data/members.ts`）：`q.trim()` → `OR: [{ realName }, { name }, { nickname }, { email }, { spiritId }]`，皆 `{ contains: q, mode: 'insensitive' }`。

## Goals / Non-Goals

**Goals**
1. 好友卡片性別改用共用 `GenderIcon` 元件（取代文字「（男／女）」）。
2. 所有「傳訊息」入口：與對象已有對話 → 直接開「`lastMessageAt` 最新」的一筆；無 → 進新對話畫面。移除既有對話選擇 picker。
3. 好友清單上方「名稱／啟動編號」搜尋（子字串、大小寫／空白不敏感）。
4. 好友清單每頁 50 筆、可換頁。
5. `Friendship.pinnedAt` ＋ 每張卡釘選／取消釘選 ＋ 排序「釘選優先、其餘加入時間新到舊」。
6. 修正手機送出訊息後 textarea／Footer 被捲出可視範圍。

**Non-Goals**
- 不改單向好友模型、加好友（Drawer／掃碼／啟動編號）、加好友通知、移除好友、傳訊息授權（非好友仍可互傳）。
- 不改 `ConversationMembersDialog`「從好友加入」邀請功能（仍需完整 `friends` 清單）。
- 不改 `?tab=` 行為、Topbar 社群入口、桌機（`≥ sm`）訊息頁籤雙欄外框版面與互動。
- 不做伺服器端好友搜尋／分頁 API（好友數量級小，client 端就 `initialFriends` 全量處理）。
- 不保留「開新平行對話」的 UI 入口（隨 picker 一併移除；資料模型與既存平行對話不動）。

## Decisions

### D1 — 好友卡片性別圖示

`friends-list.tsx`：

- import `import { GenderIcon } from '@/components/shared/gender-icon'`。
- 移除 `nameWithGender` 三元字串；名稱列改：
  ```tsx
  <div className="flex items-center gap-1 min-w-0">
    <GenderIcon gender={f.gender} />
    <p className="truncate text-sm font-medium">{f.displayName}</p>
  </div>
  ```
  （圖示置名稱前；`shrink-0` 已在元件內。）
- `community.genderMale` / `community.genderFemale` 於本檔不再引用（key 不刪，避免波及；若全庫 grep 確認僅此處使用，可於 tasks 註記保留）。
- `useTranslations('community')` 仍需保留（`friendsEmpty`、新搜尋／釘選 key）。

### D2 — 「傳訊息」直接開最近一筆對話（移除 picker）

**`messages-page.tsx` `openWithUser` 改寫：**
```ts
const openWithUser = useCallback(async (targetUserId: string) => {
  setLoading(true)
  const candidates = await fetchConversationsWithUser(targetUserId)
  setLoading(false)
  if (candidates.length === 0) {
    startNewWithTarget(targetUserId)
    return
  }
  const latest = [...candidates].sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  )[0]
  selectConversation(latest.id)
}, [startNewWithTarget, selectConversation])
```

**移除：** state `pickingTargetUserId` / `pickingCandidates`、`isPicking`、`clearPicking`（改為 `selectConversation` / `startNewWithTarget` 內不再需要清 picking；保留兩函式本體，移除其中 `clearPicking()` 呼叫）、handlers `handlePickExisting` / `handlePickNew`、以及右側 `isPicking ? (…) : selected ? (…) : (…)` 的 `isPicking` 分支整段 JSX。`startConversation` / `fetchPreviewNewConversation` / `startNewWithTarget` 保留（no-conversation 情境仍用）。

**`selectConversation`**：目前簽章 `(conversationId: number)`，內部呼叫 `clearPicking()` → 移除該行即可；其餘（`fetchConversationMessages` → `setSelected` → `setMobileShowThread(true)` → `refreshConversations`）不變。

**手機行為**：`selectConversation` 已 `setMobileShowThread(true)`，深連結／好友卡片點「傳訊息」在手機會直接顯示對話串（與過去點 picker 後一致）。

**`?with=` 深連結**：`useEffect` 不變（仍呼叫 `openWithUser`）→ 自動落到最近一筆或新對話畫面。

**`contact-member` spec 連動**：「各頁面『傳訊息』入口」需求中「已有一筆以上 → 先顯示選擇畫面」與「選擇畫面點選既有／開新對話」情境由「直接開最近一筆」取代（見 delta）。`任何會員發起或接續對話` 需求的資料層能力（可建立多筆獨立對話）不變，僅 UI 入口精簡。

### D3 — 好友清單搜尋（client 端）

資料層 `FriendListItem` 增補比對來源，二選一：

- **方案 A（採用）**：`getMyFriends` 於 `.map` 產生 `searchText: string`（`[realName, englishName, nickname, spiritId].filter(Boolean).join(' ').toLowerCase()`），`FriendListItem` 新增 `searchText: string`。UI 端比對 `f.searchText.includes(q.trim().toLowerCase())`。優點：不外洩額外個資欄位、比對邏輯集中。
- 方案 B：型別直接帶 `realName/englishName/nickname` 原欄位，UI 端自行組。→ 多回傳三個可能為 null 的個資欄位，捨棄。

`friends-list.tsx`：
```tsx
const [query, setQuery] = useState('')
const q = query.trim().toLowerCase()
const filtered = useMemo(
  () => (q ? friends.filter((f) => f.searchText.includes(q)) : friends),
  [friends, q]
)
```
搜尋框：`<Input>` 置格狀上方（`mb-3`），`placeholder = t('searchPlaceholder')`，`value=query` `onChange`。`q` 變更時 `setPage(1)`（見 D4，用 `useEffect([q])`）。

- `friends` 已由父層依「釘選優先→加入時間」排序（D5 資料層 orderBy），`filter` 保序 → 釘選優先在搜尋結果中一致。
- 空清單（`friends.length === 0`）→ 既有 `friendsEmpty` 空狀態。
- 有好友但搜尋無結果（`filtered.length === 0 && q`）→ 顯示 `t('searchEmpty')`（沿用 `rounded-lg border p-10 text-center text-sm text-muted-foreground` 樣式），搜尋框仍在上方可清除。

### D4 — 分頁（每頁 50，client 端）

```tsx
const PAGE_SIZE = 50
const [page, setPage] = useState(1)
useEffect(() => { setPage(1) }, [q])
const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
const pageClamped = Math.min(page, totalPages)
const pageItems = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)
```
- 格狀改 `pageItems.map(...)`。
- `filtered.length > PAGE_SIZE` 時，格狀下方顯示換頁列：`上一頁`（`disabled={pageClamped <= 1}`）／`第 {pageClamped} / {totalPages} 頁`（`t('pageIndicator', { page, total })`）／`下一頁`（`disabled={pageClamped >= totalPages}`）。`≤ 50` 筆不顯示。
- 釘選／取消、移除好友造成 `friends` 變動後 `pageClamped` 會自動夾住；若當前頁變空，顯示該頁（`pageClamped` 已 min 到 `totalPages`）。

### D5 — 釘選好友

**Schema**（`prisma/schema/friendship.prisma`）：
```prisma
model Friendship {
  id       Int    @id @default(autoincrement())
  ownerId  String @db.Uuid
  friendId String @db.Uuid
  owner    User @relation("FriendshipOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  friend   User @relation("FriendshipFriend", fields: [friendId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())
  pinnedAt  DateTime?                    // 新增：null=未釘選
  @@unique([ownerId, friendId])
  @@index([ownerId])
  @@map("friendships")
}
```
`make schema-update name=add_friendship_pinned_at`（新欄位 nullable，相容線上既有資料，不需資料回填）。

**資料層**（`lib/data/friendship.ts`）：
- `FriendListItem` 新增 `pinnedAt: Date | null`（放 `roles` 之後、`addedAt` 之前）＋（D3）`searchText: string`。
- `getMyFriends`：`select` 頂層加 `pinnedAt: true`（與 `createdAt` 同層）；`orderBy` 改
  ```ts
  orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
  ```
- `.map` 補 `pinnedAt: r.pinnedAt`、`searchText`（見 D3）。

**Server Action**（`app/actions/friendship.ts`）：
```ts
export async function togglePinFriend(friendUserId: string): Promise<ActionResponse> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: '請先登入' }
  const row = await prisma.friendship.findUnique({
    where: { ownerId_friendId: { ownerId: session.user.id, friendId: friendUserId } },
    select: { pinnedAt: true },
  })
  if (!row) return { success: false, message: '找不到該好友' }
  await prisma.friendship.update({
    where: { ownerId_friendId: { ownerId: session.user.id, friendId: friendUserId } },
    data: { pinnedAt: row.pinnedAt ? null : new Date() },
  })
  revalidatePath('/messages')
  return { success: true }
}
```
（`@@unique([ownerId, friendId])` → Prisma 複合唯一鍵名 `ownerId_friendId`。）

**UI**（`friends-list.tsx`）：卡片功能列（`mt-auto flex gap-2`）加釘選鈕，置「傳訊息」「刪除」之間或最左：
```tsx
<Button
  variant="ghost" size="sm"
  aria-label={f.pinnedAt ? t('unpin') : t('pin')}
  title={f.pinnedAt ? t('unpin') : t('pin')}
  onClick={() => handleTogglePin(f.userId)}
  disabled={pinningId === f.userId}
>
  {f.pinnedAt ? <IconPinFilled className="h-4 w-4 text-primary" /> : <IconPin className="h-4 w-4" />}
</Button>
```
`handleTogglePin` 比照 `handleRemove`：呼叫 `togglePinFriend` → 成功則 `onRemoved()`（重抓好友；語意上是「清單有變更」，沿用同一 reload 回呼；若嫌命名，改 prop 名 `onChanged`，本 CR 採沿用 `onRemoved` 以縮小 diff — tasks 註記）。已釘選卡片可另加視覺標記（`IconPinFilled` 於名稱列，非必要）。

**排序一致性**：資料層 orderBy 已保證「釘選（pinnedAt desc）優先、其餘 createdAt desc」；client `filter` / `slice` 保序 → 搜尋結果與每一頁都維持釘選在前。

### D6 — 手機送出訊息後版面不被捲出

**症狀**：手機寬度，`test2` 對話送出成功 → 整個 document 下捲，`Textarea` ＋ `Footer` 出現在畫面下方（本應在面板內／面板下方而非視窗外）。

**成因分析（依可能性）**：
1. **自動捲動外溢**：送出成功 → `messages-page` `setSelected(新訊息)` → `ConversationThread` `key` 不變（同一 `selected.id`）但 `messages` 更新 → `MessageScrollerItem scrollAnchor` 對新的最後一則觸發捲動；若底層以 `Element.scrollIntoView()`（預設會捲動**所有**可捲動祖先，含 document）實作，會把 document 也往下捲，露出面板下緣與 `Footer`。
2. **面板＋Footer 超出視窗**：`h-[calc(100dvh-13rem)]` 的 `13rem` 未涵蓋 `Topbar` 高 ＋ `main` `py-6`（上下共 3rem）＋ `Footer` 高，導致「訊息」頁籤下整頁高度 > `100dvh`，document 本就可捲；配合 (1) 的捲動就把使用者視野帶離輸入框。
3. 次要：送出後若對 `Textarea` 重新 `focus()`，行動瀏覽器會把輸入元素捲入畫面。

**修正方向（實作階段擇一或併用，以 repro 驗證為準）**：
- **A｜收斂捲動範圍**：`conversation-thread.tsx` — 確認 `MessageScrollerViewport` 已 `overscroll-contain`（primitive 已有）；若可傳參，`scrollAnchor` 對應的捲動改 `{ block: 'nearest', inline: 'nearest' }` 或改用 scroller context 提供的「捲到底」API（僅動 viewport `scrollTop`）。若 primitive 不可控，於 `MessageScroller` 外層加 `overscroll-contain` 並確保其為最近的可捲動祖先。
- **B｜面板高度鏈**：把「訊息」`TabsContent` 面板改為由父層 flex 高度決定：外層 `flex min-h-0 flex-col`，面板 `flex-1 min-h-0`（取代 `h-[calc(100dvh-13rem)]`），並確保 `(user)` layout `main` 在此頁能形成有界高度（必要時 `messages/page.tsx` 外包一層 `h-[100dvh]` / `min-h-0` 容器，或在 `messages-page.tsx` 最外層 `div` 加 `flex min-h-0 flex-col`）。目標：「訊息」頁籤下 document 不可捲，捲動只發生在對話串 viewport。
- **C｜避免 re-focus 捲動**：送出成功清空 `body` 後不主動 `focus()`（現況 `conversation-thread.tsx` 未顯式 focus，若 A/B 已解可不動）。

**驗收（repro）**：開發環境以 `test2` 帳號登入（賈斯汀 → 管理者的測試對話），手機寬度（DevTools 375px）在該對話輸入文字送出：送出成功後對話串捲到最新訊息，`Textarea`＋送出鈕仍完整可見、`Footer` 未被推入視野、document 未整體下捲。桌機（`≥ sm`）版面與行為不變。

### D7 — i18n key

`messages/zh-TW.json` `community` 新增（`messages/en.json` 對應）：

| key | zh-TW | en |
| --- | --- | --- |
| `searchPlaceholder` | 搜尋名稱或啟動編號 | Search by name or ID |
| `searchEmpty` | 查無符合的好友 | No matching friends |
| `pin` | 釘選 | Pin |
| `unpin` | 取消釘選 | Unpin |
| `pageIndicator` | 第 {page} / {total} 頁 | Page {page} / {total} |
| `prevPage` | 上一頁 | Previous |
| `nextPage` | 下一頁 | Next |

改 `zh-TW` 後 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`（`prebuild` 亦會跑）。`genderMale` / `genderFemale` 保留不刪。

## Risks / Trade-offs

- **移除 picker → 失去「開新平行對話」UI 入口**：使用者已明確接受（Open Questions）。既有平行對話仍可從頻道列表各自開啟；資料層 `startConversation` 能力保留，未來要恢復入口成本低。
- **`fetchConversationsWithUser` 回傳順序不保證** → D2 於 client 端以 `lastMessageAt` 明確排序後取第一筆，不倚賴伺服器排序。
- **client 端搜尋／分頁**：依賴 `initialFriends` 為「全量」。目前 `getMyFriends` 確實回全部好友（`ConversationMembersDialog` 也靠這點），維持不變即安全。若某使用者好友數達數千級，client 過濾成本上升——屬極端情形，超出「小優化」範圍，必要時另開 CR 改伺服器端。
- **`searchText` 含真實姓名／暱稱**：僅送到「本人的好友清單」client（本就會顯示這些人的顯示名稱），不新增可見個資面；比 `realName` 等原欄位逐一下放更收斂。
- **`Friendship.pinnedAt` migration**：nullable、無預設回填、線上相容；回滾＝`DROP COLUMN`（無資料依賴）。
- **手機版面修正方案 B 動到高度鏈**：可能影響「訊息」頁籤在桌機的既有 `sm:` 版面——實作須保留 `sm:` 分支不變，僅調整 `< sm` 與外層容器；桌機迴歸測試（雙欄外框、返回鍵、選字複製）。
- **釘選鈕擠壓卡片功能列**：手機單欄卡片內三顆鈕（釘選／傳訊息／刪除）寬度，`傳訊息` 用 `flex-1`、釘選與刪除用 `size="sm"` icon，實測 375px 不換行溢出。

## Migration Plan

1. `prisma/schema/friendship.prisma` 加 `pinnedAt DateTime?` → `make schema-update name=add_friendship_pinned_at`（本機 dev；test/prod 走既有 `prisma migrate deploy` 流程）。
2. 其餘為程式碼變更，部署即生效。
3. 回滾：還原 `friendship.ts` / `friends-list.tsx` / `messages-page.tsx` / `conversation-thread.tsx` / i18n / 手冊 / `version.json`；DB 併行保留或 `DROP COLUMN friendships.pinnedAt`（無外鍵、無資料依賴）。

## Open Questions

無（第 2 點行為與 picker 移除已由使用者確認；第 6 點根因待實作階段以 repro 定位，方向如 D6）。
