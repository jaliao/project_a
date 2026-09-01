## 1. 資料模型：`Friendship`

- [x] 1.1 新檔 `prisma/schema/friendship.prisma`：`model Friendship { id Int @id @default(autoincrement()); ownerId String @db.Uuid; friendId String @db.Uuid; owner User @relation("FriendshipOwner", fields:[ownerId], references:[id], onDelete: Cascade); friend User @relation("FriendshipFriend", fields:[friendId], references:[id], onDelete: Cascade); createdAt DateTime @default(now()); @@unique([ownerId, friendId]); @@index([ownerId]); @@map("friendships") }`＋檔首標準註解
- [x] 1.2 `prisma/schema/user.prisma` 的 `User` 加反向關聯：`friendshipsOwned Friendship[] @relation("FriendshipOwner")`、`friendshipsAsFriend Friendship[] @relation("FriendshipFriend")`
- [x] 1.3 `make schema-update name=add_friendship` → migration `20260901061257_add_friendship`（`CREATE TABLE friendships` ＋ 2 index ＋ 2 FK ON DELETE CASCADE；**純新增表**、未動既有欄位、正式資料相容）
- [x] 1.4 `make prisma-dev-seed`（好友為使用者資料、seed 不需新增；無動作）

## 2. 資料層：`lib/data/friendship.ts`（新檔）

- [x] 2.1 檔首標準註解（`lib/data/friendship.ts`、日期 `2026-09-01`）
- [x] 2.2 `export async function getMyFriends(userId: string)`：`prisma.friendship.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, friend: { select: { id, spiritId, avatarKey, realName, englishName, nickname, displayNameMode } } } })`；`.map` → `{ userId, spiritId, displayName: getMemberDisplayName(friend), avatarUrl: <沿用專案既有頭像 URL 組法>, addedAt }`。匯出型別 `FriendListItem`
- [x] 2.3 `export async function isFriend(ownerId, friendId): Promise<boolean>`：`prisma.friendship.count(...) > 0`
- [x] 2.4 頭像 URL：對齊 `components/conversation/messages-page.tsx` / `UserAvatar` 現用的來源 helper，不自創

## 3. Server Actions：`app/actions/friendship.ts`（新檔）

- [x] 3.1 檔首標準註解 ＋ `'use server'`；沿用專案 `ActionResponse` 形狀 `{ success: boolean; message?: string; ... }`
- [x] 3.2 `addFriendBySpiritId(spiritId: string)`：
  - `auth()`；未登入 → `{ success:false, message:'請先登入' }`
  - `prisma.user.findUnique({ where: { spiritId: spiritId.trim().toUpperCase() }, select: { id, realName, englishName, nickname, displayNameMode } })`
  - 查無 → `{ success:false, message:'找不到該啟動編號對應的會員' }`
  - `target.id === me` → `{ success:false, message:'無法加自己為好友' }`
  - `await isFriend(me, target.id)` 為真 → `{ success:true, message:'已經是好友', friendUserId: target.id, alreadyFriend:true }`
  - 否則 `prisma.friendship.create({ data: { ownerId: me, friendId: target.id } })`（`@@unique` 撞則 catch 視為成功）
  - fire-and-forget `createNotification(target.id, '有人加你為社群好友', \`\${myDisplayName} 已將你加入社群好友。\`).catch(console.error)`（`myDisplayName` 取自本人 `User` 顯示名）
  - `revalidatePath('/messages')`；回 `{ success:true, message:'已加入好友', friendUserId: target.id }`
- [x] 3.3 `removeFriend(friendUserId: string)`：`auth()` → `prisma.friendship.deleteMany({ where: { ownerId: me, friendId: friendUserId } })` → `revalidatePath('/messages')` → `{ success:true }`
- [x] 3.4 `fetchMyFriends()`：`auth()` → `getMyFriends(me)`（給 client tab 刷新用）

## 4. 相依套件

- [x] 4.1 `npm i qrcode.react @zxing/browser @zxing/library --legacy-peer-deps`（`@zxing/browser` 的 peer `@zxing/library@^0.23` 需一併裝，否則 build `Module not found`）
- [x] 4.2 確認 `package.json` / lockfile 有記錄；`npm run build` 不因 SSR 匯入這兩個 client-only 套件而報錯（皆走 `next/dynamic` `ssr:false`）

## 5. 加好友 Drawer：`components/community/add-friend-drawer.tsx`（新檔，client）

- [x] 5.1 檔首標準註解；props `{ open, onOpenChange, mySpiritId, onFriendAdded }`；用既有 `components/ui/sheet.tsx`（`side="bottom"`）
- [x] 5.2 `view: 'qr' | 'scan'` state；`QRCodeCanvas` 由 `qrcode.react` 經 `next/dynamic({ ssr:false })` 動態載入
- [x] 5.3 **QR 檢視**：標題 `t('community.myQrTitle')`；`<QRCodeCanvas value={\`spiritfriend:\${mySpiritId}\`} size={200} />`；明碼顯示 `mySpiritId`；`Input`（`t('community.manualPlaceholder')`）＋「加入」按鈕 → `handleAdd(input)`；「切換掃描行動條碼」按鈕（`t('community.scanToggle')`）→ `setView('scan')`
- [x] 5.4 **掃描檢視**：`<video>` 元素；`BrowserQRCodeReader`（`@zxing/browser`，動態 import）`decodeFromVideoDevice(undefined, videoEl, cb)`；`cb` 收到結果 → `parseSpiritId(text)`（`text.startsWith('spiritfriend:') ? text.slice(13) : text`，再 `.trim().toUpperCase()`）→ 停掃描 → `handleAdd(spiritId)`
- [x] 5.5 掃描失敗（`NotAllowedError` / `NotFoundError` / 不支援）→ 顯示 `t('community.cameraDenied')` 或 `t('community.cameraUnsupported')`，就地提供手動輸入欄位
- [x] 5.6 「顯示我的行動條碼」按鈕（`t('community.scanBackToQr')`）→ 停掃描、`setView('qr')`
- [x] 5.7 相機釋放：`useEffect` cleanup、`onOpenChange(false)`、切回 QR 皆呼叫 `controls?.stop()` / 停止所有 video track
- [x] 5.8 `handleAdd(raw)`：`await addFriendBySpiritId(raw)` → 成功 `toast.success(alreadyFriend ? t('community.alreadyFriend') : t('community.added'))` ＋ `onFriendAdded()` ＋（掃描情境）切回 `qr`；失敗 `toast.error(result.message)`

## 6. 好友清單：`components/community/friends-list.tsx`（新檔，client）

- [x] 6.1 檔首標準註解；props `{ friends: FriendListItem[], onOpenConversation: (userId: string) => void, onRemoved: () => void }`
- [x] 6.2 空清單 → `t('community.friendsEmpty')` 空狀態
- [x] 6.3 每列：`<UserAvatar>` ＋ 顯示名 ＋ `spiritId`（`text-xs text-muted-foreground`）；整列可點 → `onOpenConversation(f.userId)`；右側 overflow / 按鈕「移除」
- [x] 6.4 移除：`AlertDialog` 確認（`t('community.removeConfirm')`）→ `await removeFriend(f.userId)` → `onRemoved()` ＋ `toast`

## 7. 社群頁重構

- [x] 7.1 `app/[locale]/(user)/messages/page.tsx`：`Promise.all([getMyConversations(userId), getMyFriends(userId)])`，`initialFriends` 傳入元件；`metadata.title`（或 `generateMetadata`）「訊息 — 啟動事工」→「社群 — 啟動事工」；檔首註解日期 `2026-09-01`
- [x] 7.2 `components/conversation/messages-page.tsx`：props 加 `initialFriends`；`useTranslations('community')` 取頁首/頁籤文案（對話內文案維持 `conversation` 命名空間）
- [x] 7.3 外層加頁首：`<h1>{tCommunity('title')}</h1>` ＋「加好友」按鈕（`IconUserPlus`，`onClick` 開 `AddFriendDrawer`）；h1 不再用 `t('pageTitle')`
- [x] 7.4 加「好友 | 訊息」頁籤：用 `components/ui/tabs.tsx`（若專案已有；否則兩顆 toggle 按鈕）；`tab` state 初值＝`?tab=` → 預設 `friends`；`initialWithUserId` 有值時強制 `messages`；切 tab 時 `router.replace` 更新 `?tab=`（不重載）
- [x] 7.5 「訊息」頁籤內容＝**現有**頻道列表＋對話視圖＋選擇畫面＋窄螢幕 `mobileShowThread` 切換，完全不動邏輯
- [x] 7.6 抽 `openWithUser(userId: string)`：把現有「掛載時依 `initialWithUserId` 起對話」的流程（`fetchConversationsWithUser` → 0 筆 `startNewWithTarget` / ≥1 筆顯示選擇畫面）抽成函式，供 `initialWithUserId` 的 `useEffect` 與「好友列點擊」共用
- [x] 7.7 「好友」頁籤：`<FriendsList friends={friends} onOpenConversation={(uid) => { setTab('messages'); openWithUser(uid) }} onRemoved={reloadFriends} />`
- [x] 7.8 `reloadFriends`：`const list = await fetchMyFriends(); setFriends(list)`（加好友 / 移除後呼叫）；`friends` 為 `useState(initialFriends)`
- [x] 7.9 `<AddFriendDrawer open={addOpen} onOpenChange={setAddOpen} mySpiritId={mySpiritId} onFriendAdded={reloadFriends} />`；`mySpiritId` 由 page 從 session 帶下來（或既有 props）

## 8. Topbar 改名＋換 icon

- [x] 8.1 `components/layout/topbar.tsx`：import 加 `IconUsersGroup`（`@tabler/icons-react`）
- [x] 8.2 `menuItems` 的 `messages` 項：`icon: IconMessage` → `IconUsersGroup`；`label: t('messages')` → `t('community')`；`key`、`badge: unreadMessageCount`、`onClick: go('/messages')` 不變
- [x] 8.3 桌機獨立「訊息」按鈕（約 L179–184）：`icon` 換 `IconUsersGroup`、`title={t('community')}`；`onClick` 仍 `/messages`
- [x] 8.4 若 `IconMessage` 因此不再被使用，從 import 移除（避免 lint unused）

## 9. i18n

- [x] 9.1 `messages/zh-TW.json` `nav` 加 `"community": "社群"`；`nav.messages`（「訊息」）**保留不動**
- [x] 9.2 `messages/zh-TW.json` 新增 `community` 命名空間：`title`／`addFriend`／`tabFriends`／`tabMessages`／`friendsEmpty`／`myQrTitle`／`myQrHint`／`scanToggle`／`scanBackToQr`／`manualLabel`／`manualPlaceholder`／`add`／`added`／`alreadyFriend`／`addSelfError`／`notFoundError`／`removeFriend`／`removeConfirm`／`cameraDenied`／`cameraUnsupported`（值見 design.md 表）
- [x] 9.3 `messages/en.json`：對應補上 `nav.community` 與整個 `community` 命名空間英文
- [x] 9.4 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`
- [x] 9.5 `grep -rn "訊息" components/layout/topbar.tsx` 確認元件無寫死中文（改用 key）

## 10. 驗證

- [x] 10.1 `npm run lint`：本次檔案 0 error
- [x] 10.2 `npx tsc --noEmit`：0 error
- [x] 10.3 `npm run build`：`✓ Compiled successfully`（含 `qrcode.react` / `@zxing/browser` 動態載入不破壞 SSR）
- [ ] 10.4 **（人工實測）** Topbar 桌機與手機選單該項顯示「社群」＋新圖示，點擊到 `/messages`；未讀角標行為不變
- [ ] 10.5 **（人工實測）** `/messages` 頁首顯示「社群」＋「加好友」；頁籤「好友 | 訊息」；預設「好友」；`?tab=messages` / `?with=<uid>` 行為正確
- [ ] 10.6 **（人工實測）** 「訊息」頁籤：頻道列表、對話、釘選、未讀、群組標題、邀請、窄螢幕返回、桌面選取複製——皆與改版前一致（回歸）
- [ ] 10.7 **（人工實測）** 加好友：①手動輸入有效啟動編號→加入、清單出現、對方收到 Inbox 通知；②輸入自己的→擋；③不存在的→「找不到…」；④已是好友→「已經是好友」不重複
- [ ] 10.8 **（人工實測）** 加好友 Drawer：我的 QR 顯示正確（值 `spiritfriend:<spiritId>`）；「切換掃描」開相機、掃另一支手機顯示的 QR → 加入成功、切回 QR、清單更新
- [ ] 10.9 **（人工實測）** 相機權限拒絕 / 桌機無相機 → 顯示提示並可用手動輸入；關閉 Drawer / 切回 QR → 相機指示燈熄滅
- [ ] 10.10 **（人工實測）** 「好友」頁籤點某好友 → 切到「訊息」頁籤並開啟與其對話（有既有對話顯示選擇畫面，否則新對話）；移除好友 → 確認框 → 清單移除、既有對話保留
- [ ] 10.11 **（人工實測）** 非好友之間仍可透過 `/user/{spiritId}` 或後台「傳訊息」發起對話（權限未變）
- [ ] 10.12 **（人工實測）** RWD：手機／桌機下社群頁頁首、頁籤、好友清單、Drawer 皆正常

## 11. 文件與版本號同步

- [x] 11.1 `doc/學員手冊.md`：「訊息」章節更名「社群」；補「好友」頁籤（好友清單、點好友開對話、移除）與「加好友」（我的行動條碼／掃碼／輸入啟動編號、單向即時、會通知對方）；頂部工具列按鈕列表「訊息」→「社群」；檔首版本＋日期
- [x] 11.2 `doc/管理者操作手冊.md`／`doc/老師手冊.md`：頂部工具列按鈕列表「訊息」→「社群」；檔首版本＋日期
- [x] 11.3 `config/version.json`：patch +1（以套用當下值為基準），`updatedAt` → 套用當日
- [x] 11.4 `ai-context/03-architecture.md`：補 `prisma/schema/friendship.prisma`、`app/actions/friendship.ts`、`lib/data/friendship.ts`、社群頁「好友 | 訊息」頁籤、Topbar 條目「訊息」→「社群」
- [x] 11.5 `ai-context/04-data-model.md`：新增 `Friendship`（單向好友，`@@unique([ownerId, friendId])`）
- [x] 11.6 `ai-context/07-current-tasks.md`：於「已完成」清單最前面追加本 CR 記錄
- [x] 11.7 `README-AI.md`：版本行同步
