## Context

現況（相關切片）：

- **Topbar**（`components/layout/topbar.tsx`，client）：`menuItems` 陣列統一定義桌機按鈕群與手機 `Sheet` 選單。`messages` 項目：`icon: IconMessage`、`label: t('messages')`（`nav` 命名空間＝「訊息」）、`badge: unreadMessageCount`、`onClick: go('/messages')`。未讀數由 `(user)/layout.tsx` 的 `getUnreadConversationCount(userId)` 提供。
- **訊息頁**：`app/[locale]/(user)/messages/page.tsx`（server）→ `getMyConversations(userId)` → `<MessagesPage>`（`components/conversation/messages-page.tsx`，client，353 行）。`?with={targetUserId}` 深連結：掛載時 `fetchConversationsWithUser` → 0 筆直接開新對話、≥1 筆先顯示選擇畫面。h1 用 `t('pageTitle')`（`conversation` 命名空間）。窄螢幕 `mobileShowThread` 切換頻道列表 / 對話。
- **對話資料模型**（`prisma/schema/conversation.prisma`）：`Conversation` / `ConversationParticipant`（`lastReadAt`、`pinnedAt`）/ `ConversationMessage`。無「好友 / 聯絡人」概念。
- **加人入對話**：`inviteToConversation(conversationId, targetSpiritId)` 以 `prisma.user.findUnique({ where: { spiritId: targetSpiritId.trim().toUpperCase() } })` 解析啟動編號（本 CR 加好友沿用同一 pattern）。
- **通知**：`createNotification(userId, title, body)`（`app/actions/notification.ts`，fire-and-forget，寫 `Notification` ＋ push）。`Notification` 為泛型 `{ title, body }`，無 type enum。
- **顯示名**：`getMemberDisplayName({ realName, englishName, nickname, displayNameMode })`。
- **i18n**：`messages/zh-TW.json` 唯一來源，`nav` 命名空間現有 `home/profile/notifications/matchBoard/admin/help/messages/menu/learning`；`conversation` 命名空間含頁面文案。`zh-CN` 由 `npm run gen:zh-cn` 產生（`prebuild` 自動跑）。
- **無** QR 相關套件、**無** 任何相機（`getUserMedia` / `BarcodeDetector`）使用。

本 CR＝**「訊息」品牌更名為「社群」＋ 疊加一個單向好友清單與加好友（行動條碼）流程**，對話功能本身零改動。

## Goals / Non-Goals

**Goals：**
- 前台「訊息」全部更名「社群」（Topbar 文字＋icon、頁標題、手冊），路由 `/messages` 不變。
- `/messages` 頁加「好友 | 訊息」頁籤：訊息頁籤＝現有對話功能原封不動；好友頁籤＝好友清單、點列開對話、移除好友。
- 「加好友」Drawer：我的行動條碼（QR）／相機即時掃碼／手動輸入啟動編號，三者可用。
- 單向即時加好友（免對方同意），加好友後通知對方。

**Non-Goals：**
- 不改傳訊息權限（維持任何會員互傳；`contact-member` 的「任何會員發起對話」不動）。
- 不做好友邀請 / 接受 / 拒絕 / 封鎖。
- 不做雙向自動互加（A 加 B 不會讓 B 也加到 A）。
- 不新增 `/community` 路由、不改 `?with=` 深連結行為。
- 不把好友清單接進 `inviteToConversation`（邀入群組）UI（本 CR 不碰群組邀請）。
- 後台不新增好友相關頁面。

## Decisions

### 1. 資料模型：`Friendship`（單向、新表）

`prisma/schema/friendship.prisma`：

```prisma
model Friendship {
  id        Int      @id @default(autoincrement())
  ownerId   String   @db.Uuid   // 加好友的人（清單擁有者）
  friendId  String   @db.Uuid   // 被加入的對象
  owner     User     @relation("FriendshipOwner",  fields: [ownerId],  references: [id], onDelete: Cascade)
  friend    User     @relation("FriendshipFriend", fields: [friendId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([ownerId, friendId])
  @@index([ownerId])
  @@map("friendships")
}
```

`user.prisma` 的 `User` 加：

```prisma
friendshipsOwned    Friendship[] @relation("FriendshipOwner")
friendshipsAsFriend Friendship[] @relation("FriendshipFriend")
```

- **單向**：`ownerId → friendId`。好友清單 = `where: { ownerId: me }`。
- `@@unique([ownerId, friendId])` 讓「重複加」變 idempotent（`upsert` 或先查再建）。
- Migration `add_friendship`：`make schema-update name=add_friendship`（DB 走容器內網，見 dev-migration-workflow）。純新增表，正式資料相容。
- 不設 `friendId != ownerId` 的 DB 約束（Postgres CHECK 不便於 Prisma），由 action 層擋自己加自己。

### 2. 資料層 `lib/data/friendship.ts`

```ts
export async function getMyFriends(userId: string) {
  const rows = await prisma.friendship.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      friend: {
        select: { id: true, spiritId: true, avatarKey: true,
                  realName: true, englishName: true, nickname: true, displayNameMode: true },
      },
    },
  })
  return rows.map((r) => ({
    userId: r.friend.id,
    spiritId: r.friend.spiritId,
    displayName: getMemberDisplayName(r.friend),
    avatarUrl: avatarUrlFromKey(r.friend.avatarKey),   // 沿用專案既有頭像 URL 組法
    addedAt: r.createdAt,
  }))
}

export async function isFriend(ownerId: string, friendId: string): Promise<boolean> {
  return (await prisma.friendship.count({ where: { ownerId, friendId } })) > 0
}
```

（頭像 URL 的組法沿用 `messages-page.tsx` / `UserAvatar` 現用的來源；實作時對齊既有 helper，不自創。）

### 3. Server Actions `app/actions/friendship.ts`

`ActionResponse` 沿用專案慣例 `{ success, message?, ... }`。

- **`addFriendBySpiritId(spiritId: string)`**
  1. `auth()`；未登入 → `{ success:false, message:'請先登入' }`。
  2. `const target = await prisma.user.findUnique({ where: { spiritId: spiritId.trim().toUpperCase() }, select: { id:true, realName:true, englishName:true, nickname:true, displayNameMode:true } })`。
  3. 查無 → `{ success:false, message:'找不到該啟動編號對應的會員' }`。
  4. `target.id === me` → `{ success:false, message:'無法加自己為好友' }`。
  5. 已是好友（`isFriend`）→ `{ success:true, message:'已是好友', friendUserId: target.id, alreadyFriend:true }`。
  6. 建 `Friendship { ownerId: me, friendId: target.id }`（`create`；`@@unique` 撞了就當成功）。
  7. fire-and-forget `createNotification(target.id, '有人加你為社群好友', \`\${myDisplayName} 已將你加入社群好友。\`).catch(log)`。
  8. `revalidatePath('/messages')`；回 `{ success:true, message:'已加入好友', friendUserId: target.id }`。
- **`removeFriend(friendUserId: string)`**：`auth()` → `prisma.friendship.deleteMany({ where: { ownerId: me, friendId: friendUserId } })` → `revalidatePath('/messages')` → `{ success:true }`（`deleteMany` 0 筆也算成功）。
- **`fetchMyFriends()`**：`auth()` → `getMyFriends(me)`。

> `message` 為動作層文案（toast 直接顯示），非 i18n key——與 `conversation` action 現況一致。頁面自身的 UI 文字才走 `community.*` key。

### 4. 頁面重構：`messages-page.tsx` → 社群容器

`app/[locale]/(user)/messages/page.tsx`（server）：
- 併抓 `const [conversations, friends] = await Promise.all([getMyConversations(userId), getMyFriends(userId)])`，`friends` 傳入元件。
- `generateMetadata` / `metadata.title`：「訊息 — 啟動事工」→「社群 — 啟動事工」（若目前是靜態 `metadata`，改字串即可）。

`components/conversation/messages-page.tsx`：
- Props 加 `initialFriends: FriendListItem[]`。
- 外層改為：
  ```
  <div className="mx-auto max-w-5xl">
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">{tCommunity('title')}</h1>
      <Button size="sm" onClick={() => setAddOpen(true)}>
        <IconUserPlus className="mr-1 h-4 w-4" /> {tCommunity('addFriend')}
      </Button>
    </div>
    <Tabs value={tab} onValueChange={setTab}>            {/* components/ui/tabs.tsx，若無則用簡易兩顆 toggle 按鈕 */}
      <TabsList>
        <TabsTrigger value="friends">{tCommunity('tabFriends')}</TabsTrigger>
        <TabsTrigger value="messages">{tCommunity('tabMessages')}</TabsTrigger>
      </TabsList>
      <TabsContent value="friends"><FriendsList .../></TabsContent>
      <TabsContent value="messages">{/* 既有頻道列表＋對話視圖，原封不動 */}</TabsContent>
    </Tabs>
    <AddFriendDrawer open={addOpen} onOpenChange={setAddOpen} mySpiritId={...} onFriendAdded={reloadFriends} />
  </div>
  ```
- `tab` state：初值＝`?tab=` → `friends`（預設）；**若 `initialWithUserId` 有值則強制 `messages`**（並照舊觸發選擇 / 開新對話流程）。切 tab 時 `router.replace` 更新 `?tab=`（淺導航，不重載）。
- `conversation` 命名空間的 `pageTitle` 不再使用（h1 改 `community.title`）；其餘 `t('emptyState')` 等對話內文案不動。
- `reloadFriends`：`fetchMyFriends()` → `setFriends(...)`（加好友 / 移除後刷新）。

`components/community/friends-list.tsx`（client）：
- 無好友 → `community.friendsEmpty` 空狀態。
- 每列：`<UserAvatar>` ＋ 顯示名 ＋ `spiritId`（`text-xs text-muted-foreground`）＋ 右側 overflow「移除」。
- 點列（非移除鈕）→ `onOpenConversation(friend.userId)`：由父層切到 `messages` tab 後執行等同 `initialWithUserId` 的流程（`fetchConversationsWithUser` → 選擇 / 開新）。實作上把父層既有的「以 targetUserId 起對話」邏輯抽成 `openWithUser(userId)` 供 `?with=` 與好友列共用。
- 移除：`AlertDialog` 確認（`community.removeConfirm`）→ `removeFriend(friend.userId)` → `reloadFriends()` ＋ toast。

### 5. `AddFriendDrawer`（`components/community/add-friend-drawer.tsx`，client）

用既有 `Sheet`（`side="bottom"`；手機從下、桌機亦可）。`view: 'qr' | 'scan'` state。

**QR 檢視（預設）：**
- `community.myQrTitle` 標題 ＋ `<QrCanvas value={\`spiritfriend:\${mySpiritId}\`} size={200} />`（`qrcode.react` 的 `QRCodeCanvas`，`dynamic(..., { ssr:false })`）。
- 明碼顯示 `mySpiritId`（方便口述）。
- 分隔線 ＋ 「手動輸入啟動編號」：`Input`（`community.manualPlaceholder`）＋「加入」`Button` → `handleAdd(input)`。
- 「切換掃描行動條碼」`Button`（`community.scanToggle`）→ `setView('scan')`。

**掃描檢視：**
- `<video ref>` 佔位；掛載時 `const reader = new BrowserQRCodeReader()`（`@zxing/browser`，`dynamic import`），`reader.decodeFromVideoDevice(undefined, videoEl, (result, err) => { if (result) handleScan(result.getText()) })`。
- `handleScan(text)`：`parseSpiritId(text)` — 接受 `spiritfriend:XXXX` 前綴或純 `XXXX`；擷取後停掃描（`controls.stop()`）→ `handleAdd(spiritId)`。
- 相機失敗（`NotAllowedError` / `NotFoundError` / 不支援）→ 顯示 `community.cameraDenied` / `community.cameraUnsupported`，並就地顯示「手動輸入啟動編號」欄位作為退路。
- 「切換」`Button`（`community.scanBackToQr`）→ 停掃描、`setView('qr')`。
- `useEffect` cleanup ＋ `onOpenChange(false)`：`controls?.stop()` 釋放相機。

**`handleAdd(raw)`（共用）：**
- `const r = await addFriendBySpiritId(raw)`；`r.success` → `toast.success(r.alreadyFriend ? tCommunity('alreadyFriend') : tCommunity('added'))` ＋ `onFriendAdded()` ＋（掃描情境）切回 `qr`；失敗 → `toast.error(r.message)`。

**動態載入：** `qrcode.react`、`@zxing/browser` 皆 `next/dynamic` `ssr:false`，Drawer 開啟才載入。

### 6. Topbar 改名＋換 icon

`components/layout/topbar.tsx`：
- import 增 `IconUsersGroup`（Tabler，`@tabler/icons-react` 已有）。
- `menuItems` 的 `messages` 項：`icon: IconMessage` → `IconUsersGroup`；`label: t('messages')` → `t('community')`。
- 桌機那顆獨立按鈕（`components/layout/topbar.tsx` L179–184 附近）同步：`icon`、`title={t('community')}`。
- `key`、`onClick`（`/messages`）、`badge`（`unreadMessageCount`）不變。

i18n：
- `messages/zh-TW.json` `nav` 加 `"community": "社群"`；`messages/en.json` 加 `"community": "Community"`。
- `nav.messages`（「訊息」）**保留**——避免其他潛在引用回退顯示 key；本 CR 只有 topbar 改用 `nav.community`。

### 7. `community` i18n 命名空間（zh-TW 值示意）

| key | zh-TW | en |
|---|---|---|
| `community.title` | 社群 | Community |
| `community.addFriend` | 加好友 | Add friend |
| `community.tabFriends` | 好友 | Friends |
| `community.tabMessages` | 訊息 | Messages |
| `community.friendsEmpty` | 還沒有好友，點「加好友」開始 | No friends yet — tap "Add friend" to start |
| `community.myQrTitle` | 我的行動條碼 | My QR code |
| `community.myQrHint` | 請對方掃描，或提供你的啟動編號 | Let others scan this, or share your Spirit ID |
| `community.scanToggle` | 切換掃描行動條碼 | Scan a QR code |
| `community.scanBackToQr` | 顯示我的行動條碼 | Show my QR code |
| `community.manualLabel` | 輸入啟動編號加好友 | Add by Spirit ID |
| `community.manualPlaceholder` | 例：PA260001 | e.g. PA260001 |
| `community.add` | 加入 | Add |
| `community.added` | 已加入好友 | Friend added |
| `community.alreadyFriend` | 已經是好友了 | Already friends |
| `community.addSelfError` | 無法加自己為好友 | You can't add yourself |
| `community.notFoundError` | 找不到該啟動編號對應的會員 | No member found for that Spirit ID |
| `community.removeFriend` | 移除好友 | Remove friend |
| `community.removeConfirm` | 確定要從好友清單移除？ | Remove this friend? |
| `community.cameraDenied` | 沒有相機權限，改用輸入啟動編號 | Camera blocked — add by Spirit ID instead |
| `community.cameraUnsupported` | 此裝置無法掃碼，改用輸入啟動編號 | Scanning unavailable — add by Spirit ID instead |

`npm run gen:zh-cn` 重產 `zh-CN`。

### 8. 行動條碼 payload

`spiritfriend:{spiritId}`（大寫）。掃描端 `parseSpiritId`：`text.startsWith('spiritfriend:') ? text.slice(13) : text`，再 `.trim().toUpperCase()`；交給 `addFriendBySpiritId` 做存在性驗證。前綴讓「掃到不相干 QR」時能被 `addFriendBySpiritId` 的「找不到會員」自然擋掉。

## Risks / Trade-offs

- **[取捨] 新增兩個 npm 套件**（`qrcode.react`、`@zxing/browser`）：QR 產生 / 掃描自幹不划算；兩者皆成熟、client-only、動態載入，不進首屏。安裝走 `--legacy-peer-deps`（專案慣例）。
- **[風險] iOS Safari 相機**：`getUserMedia` 需 HTTPS 且使用者手勢觸發；`@zxing/browser` 支援度佳，但仍可能失敗——已設「失敗即退回手動輸入」。掃描檢視務必在使用者點「切換掃描」後才 `decodeFromVideoDevice`（含手勢）。
- **[風險] 相機資源未釋放**：Drawer 關閉 / 切回 QR / 元件卸載都要 `controls.stop()`；漏掉會鏡頭常亮。列入 tasks 驗證。
- **[取捨] 單向好友**：A 的清單有 B、B 的清單沒有 A，可能不符部分使用者對「好友」的雙向直覺——但這是使用者明確選的（免同意、即時），且通知會告知被加的人。
- **[取捨] `nav.messages` key 保留不刪**：留一個未使用 key，換取不必全域 grep 確認無其他引用；日後可清。
- **[相容] `?with=` 深連結**：好友頁預設 tab 為 `friends`，但帶 `?with=` 時強制 `messages` 且照舊流程——各處「傳訊息」入口行為不變。
- **[效能] 社群頁多一次查詢**：`getMyFriends` 與 `getMyConversations` 併發（`Promise.all`），影響可忽略。

## Migration Plan

1. `prisma/schema/friendship.prisma` 新增 ＋ `user.prisma` 加反向關聯 → `make schema-update name=add_friendship` → `make prisma-dev-seed`（如需）。
2. `lib/data/friendship.ts`、`app/actions/friendship.ts`。
3. `npm i qrcode.react @zxing/browser --legacy-peer-deps`。
4. `components/community/add-friend-drawer.tsx`、`components/community/friends-list.tsx`。
5. `messages-page.tsx` 重構（頁首＋Tabs＋抽 `openWithUser`），`messages/page.tsx` 併抓 friends、改 metadata title。
6. `topbar.tsx` icon＋label；`messages/zh-TW.json`／`en.json` 加 `nav.community` ＋ `community.*`；`npm run gen:zh-cn`。
7. `npm run lint`、`npx tsc --noEmit`、`npm run build`。
8. 實測（見 tasks §8）：更名、頁籤、加好友三途徑、通知、移除、相機釋放、`?with=` 深連結回歸、RWD。
9. `doc/` 三份手冊「訊息」→「社群」＋學員手冊補「好友 / 加好友」；`config/version.json` patch +1、`updatedAt`；`ai-context/03`＋`04`＋`07`、`README-AI.md` 同步。

**Rollback**：revert 程式碼 ＋ 移除 `friendships` 表（新表、無其他依賴）；npm 套件可留。i18n / icon 變更 revert 即回「訊息」。
