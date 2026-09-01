## Why

需求單 CR-SPEC-260901-007（提出人：廖柏嘉 Justin，2026-09-01，所屬專案 P26021 Project A 啟動靈人系統）：**「社群功能小優化」**。原文六點：

1. 社群好友卡片的**性別用圖示**（參考後台會員管理，可做成共用元件）。
2. 對好友傳訊息，**已傳過的，直接跳到那個好友過去的訊息視窗**。
3. 好友列表上方可以用**名稱或編號搜尋**。
4. 好友列表 **50 筆換頁**。
5. **常用好友可以釘選**。
6. Bug：開發環境測試——以 `test2`（賈斯汀對管理者的測試）**傳送訊息成功之後，輸入訊息內容的 textarea 和 Footer 捲到很下面**（跑出可視範圍）。

使用者澄清（2026-09-01）：

- 第 2 點——**當該好友有多筆既有對話時，一律直接跳到「最後訊息時間最新」的那一筆**（不再顯示既有對話選擇畫面）；此行為**套用到所有「傳訊息」入口**（社群「好友」卡片、學員專頁、後台會員詳情、`?with=` 深連結），行為一致。

現況（cr-spec-260901-003 / 004 / 005 皆已上線並封存）：

- **好友卡片**：`components/community/friends-list.tsx`（client）——響應式卡片格狀（手機 1 欄／`sm` 2 欄／`lg` 3 欄）。名稱後以文字「（男）／（女）」附註性別（`t('genderMale')` / `t('genderFemale')`），未設定時省略。無搜尋、無分頁、無釘選；排序＝加入時間新到舊。
- **好友資料層**：`lib/data/friendship.ts` `getMyFriends(userId)` → `FriendListItem[]`（`userId / spiritId / displayName / avatarUrl / gender / unitLabel / roles / addedAt`），`where { ownerId }`、`orderBy { createdAt: 'desc' }`。`app/[locale]/(user)/messages/page.tsx` SSR 帶入 `initialFriends`；`app/actions/friendship.ts` `fetchMyFriends()` 供 client 重整；`components/conversation/messages-page.tsx` 另把整份 `friends` 傳給 `ConversationMembersDialog`（「從好友加入」邀請搜尋）。
- **性別共用元件**：`components/shared/gender-icon.tsx` `<GenderIcon gender={'male'|'female'|'unspecified'} />`（藍色 ♂／玫瑰色 ♀／淡色中性 icon，含 `aria-label`）**已存在**，後台憑證頁與會員標籤已在用。好友卡片尚未採用。
- **「傳訊息」入口行為**：`messages-page.tsx` `openWithUser(targetUserId)`——`fetchConversationsWithUser` 查與對方的共同對話；**0 筆**→直接進新對話畫面；**1 筆以上**→設 `pickingTargetUserId` / `pickingCandidates`，右側顯示「選擇既有對話 ／ 開新對話」picker。`?with=` 深連結、好友卡片「傳訊息」皆走此函式。
- **`Friendship` model**（`prisma/schema/friendship.prisma`）：`id / ownerId / friendId / createdAt`，`@@unique([ownerId, friendId])`、`@@index([ownerId])`。無釘選欄位。
- **訊息頁籤手機版面**（cr-spec-260901-004）：`messages-page.tsx` 面板 `h-[calc(100dvh-13rem)] … overflow-hidden`（`sm:h-[calc(100vh-16rem)]`）；`conversation-thread.tsx` 內 `MessageScroller`（`@shadcn/react/message-scroller`）＋底部 `Textarea`＋送出鈕。送出成功後 `messages-page.tsx` `handleSend` → `setSelected(await fetchConversationMessages(id))` 重載訊息，`ConversationThread` 以 `key={selected.id}` 重掛、`MessageScrollerItem scrollAnchor` 自動捲到最新。`(user)` layout 為 `min-h-screen flex flex-col`（`Topbar` ＋ `main flex-1 py-6` ＋ `Footer`）。

本 CR ＝**六點小優化**，皆集中在社群「好友」頁籤與「訊息」頁籤，不動單向好友模型、加好友流程、通知、傳訊息授權規則。

## What Changes

### 1. 好友卡片性別改用共用圖示元件

`components/community/friends-list.tsx`：名稱後的文字「（男）／（女）」附註 → 改以既有 `<GenderIcon gender={f.gender} />`（`components/shared/gender-icon.tsx`）呈現於顯示名稱旁（同一列、名稱前或後）。`unspecified` 時顯示中性圖示（元件已內建）。移除 `nameWithGender` 字串組法；`community.genderMale` / `community.genderFemale` i18n key 由本卡片改為不使用（key 保留，避免影響他處）。

### 2. 「傳訊息」一律直接開啟最近一筆既有對話（移除選擇畫面）

`components/conversation/messages-page.tsx` `openWithUser(targetUserId)`：

- 既有對話 **0 筆** → 維持：直接進新對話畫面（`startNewWithTarget`）。
- 既有對話 **1 筆以上** → 改為：直接 `selectConversation(<最後訊息時間最新的一筆>.id)`，**不再顯示 picker**。

移除 picker 相關狀態與 UI：`pickingTargetUserId` / `pickingCandidates` / `isPicking` / `clearPicking` / `handlePickExisting` / `handlePickNew` 及右側「選擇既有對話 ／ 開新對話」區塊。此變更同時適用於 `?with=` 深連結（`useEffect` 仍呼叫 `openWithUser`）。「最近一筆」＝候選對話中 `lastMessageAt` 最大者（在 client 端以 `lastMessageAt` 明確排序後取第一筆，不倚賴既有 pinned-first 排序）。

> 副作用：與「已有既有對話的對象」之間，**透過「傳訊息」入口再開一筆全新平行對話**的 UI 入口將消失（平行對話的資料模型與已建立的平行對話不受影響、仍可在頻道列表各自開啟）。此為使用者明確選擇（見 Open Questions）。

### 3. 好友清單「名稱／編號」搜尋

`friends-list.tsx` 好友格狀上方新增搜尋輸入框：以關鍵字即時篩選好友，比對**顯示名稱相關欄位（真實姓名／英文名／暱稱）**與**啟動編號（`spiritId`）**，**去前後空白、大小寫不敏感、子字串比對**（比照後台「會員管理」搜尋體感）。搜尋在**目前使用者全部好友**範圍內執行。清空關鍵字即還原完整清單。搜尋結果為空時顯示「查無符合的好友」提示（沿用空狀態樣式，文案另立 key）。

為支援以姓名欄位比對，`lib/data/friendship.ts` `FriendListItem` 需額外帶出比對用欄位（`realName` / `englishName` / `nickname`）或改於資料層提供已組好的 `searchText`；細節見 design。

### 4. 好友清單分頁（每頁 50 筆）

`friends-list.tsx`：好友清單（套用搜尋後的結果集）每頁最多顯示 **50 筆**，下方提供換頁控制（上一頁／下一頁＋「第 X／Y 頁」指示，或頁碼）。搜尋關鍵字變更時頁碼重設為第 1 頁。總數 ≤ 50 時不顯示換頁控制。

### 5. 釘選常用好友

- **資料模型**：`Friendship` 新增 `pinnedAt DateTime?`（`null` ＝未釘選）。`prisma/schema/friendship.prisma` ＋ `make schema-update name=add_friendship_pinned_at`。相容既有資料（新欄位可為 `null`）。
- **資料層**：`getMyFriends` `select` 補 `pinnedAt`；`FriendListItem` 新增 `pinnedAt: Date | null`；`orderBy` 改為 `[{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]`（已釘選依釘選時間新到舊優先，其餘依加入時間新到舊）。
- **Server Action**：`app/actions/friendship.ts` 新增 `togglePinFriend(friendUserId)`——`auth()` → 對 `ownerId = me, friendId = friendUserId` 的 `Friendship` 設 `pinnedAt` 為 `now()`（釘選）或 `null`（取消）；`revalidatePath('/messages')`；回傳 `ActionResponse`。非本人好友清單中的對象視為失敗（找不到）。
- **UI**：每張好友卡片加「釘選／取消釘選」按鈕（`IconPin` / `IconPinFilled`，比照「訊息」頁籤對話釘選樣式）；已釘選卡片顯示釘選標記。釘選為清單擁有者個人化設定，**不通知對方、不影響對方清單、不影響傳訊息**。釘選 / 取消後重抓好友清單（沿用既有 reload 路徑）。
- 排序（釘選優先）跨搜尋與分頁一致：先套搜尋、再套「釘選優先」排序、再分頁。

### 6. 修正：手機送出訊息成功後版面被捲出可視範圍

送出訊息成功後，SHALL **僅捲動對話串容器至最新訊息**，SHALL NOT 造成外層頁面（document / `window`）捲動而使輸入框（`Textarea`＋送出鈕）與 `Footer` 離開可視範圍。修正方向（擇一或併用，見 design）：

- 收斂自動捲動範圍：`conversation-thread.tsx` 的自動捲動只作用於 `MessageScroller` 的 viewport，不觸發祖先（document）捲動（`scrollIntoView` 改 `block: 'nearest'` ／改用 scroller 自身 API ／確認 `overscroll-contain` 生效）。
- 讓「訊息」頁籤面板連同其下的 `Footer` 在手機視窗內完整容納：修正 `h-[calc(100dvh-13rem)]` 的高度估算（納入 `Topbar` 高、`main` `py-6`、`Footer` 高），或改以 flex `min-h-0` 鏈由父容器決定高度，使外層 document 於「訊息」頁籤下不可捲動。
- 送出後不因 re-mount／`autofocus` 造成 `Textarea` 被瀏覽器捲入視野中央。

驗證以開發環境 repro 路徑為準：以 `test2` 帳號（賈斯汀 → 管理者的測試對話）在手機寬度送出訊息，送出成功後輸入框與 Footer 仍完整可見、頁面未整體下捲。

### 7. 文件與版本號

- `doc/學員手冊.md`〈十五、社群〉：
  - 「好友頁籤」段：性別描述由「顯示名稱（性別）」文字改為「名稱旁以**性別圖示**（♂／♀）顯示」；新增「上方可用**名稱或啟動編號搜尋**」「每頁 50 位、可換頁」「可**釘選常用好友**（釘選的排在最前面）」。
  - 「傳訊息」相關描述：由「已有對話會先讓您選擇要繼續哪一則、或開新對話」改為「**已聊過的會直接開啟最近一次的對話視窗**」。
  - 「訊息頁籤」段：補「送出訊息後畫面只會捲動對話內容，輸入框與頁尾維持在畫面內」。
- `doc/老師手冊.md`／`doc/管理者操作手冊.md`：好友頁籤操作細節、「傳訊息」入口行為同步一致；檔首版本＋日期比照 rule 9。
- `config/version.json`：patch +1、`updatedAt` = 當日（`/opsx:apply` 時執行）。
- `ai-context/03-architecture.md`（`friendship.ts` `getMyFriends` 欄位／排序、`Friendship.pinnedAt`、社群「好友」頁籤搜尋／分頁／釘選、「傳訊息」入口改直接開最近對話）、`ai-context/07-current-tasks.md`（「已完成」最前面追加本 CR）、`README-AI.md` 版本行。

## Capabilities

### Modified Capabilities

- **`community-friends`**
  - 「好友清單頁籤與『點好友開對話』捷徑」需求：性別由「顯示名稱後以（男／女）文字附註」改為「名稱旁以**性別圖示**呈現（採共用 `GenderIcon` 元件）」；「傳訊息」按鈕的行為改為「以該好友為對象執行『直接開啟最近一次既有對話、無既有對話才進新對話畫面』」（與新版全域「傳訊息」入口行為一致）。
  - 新增「好友清單搜尋」需求：以名稱或啟動編號子字串（大小寫／空白不敏感）即時篩選全部好友。
  - 新增「好友清單分頁」需求：套用搜尋後每頁 50 筆、可換頁。
  - 新增「釘選好友」需求：`Friendship.pinnedAt`；每張卡可釘選／取消釘選；排序改為「釘選（依釘選時間新到舊）優先，其餘依加入時間新到舊」，跨搜尋與分頁一致；釘選為個人化設定、不通知對方、不影響傳訊息。

- **`contact-member`**
  - 「各頁面『傳訊息』入口」需求：與目標對象已有一筆以上既有對話時，改為**直接開啟「最後訊息時間最新」的一筆**，不再顯示既有對話選擇畫面（picker）；尚無對話時維持直接進新對話畫面。此行為適用所有「傳訊息」入口與 `?with=` 深連結。
  - 「訊息頁籤行動裝置版面優化」需求：新增條款／情境——送出訊息成功後 SHALL 僅捲動對話串至最新訊息，SHALL NOT 造成外層頁面捲動而使輸入框與 `Footer` 離開可視範圍。

## Impact

- **Affected code**：
  - 修改：`prisma/schema/friendship.prisma`（＋新增 migration）、`lib/data/friendship.ts`（`FriendListItem` ＋ `getMyFriends` select/orderBy/map）、`app/actions/friendship.ts`（新增 `togglePinFriend`）、`components/community/friends-list.tsx`（性別圖示＋搜尋＋分頁＋釘選）、`components/conversation/messages-page.tsx`（`openWithUser` 改直接開最近對話、移除 picker）、`components/conversation/conversation-thread.tsx`（自動捲動收斂／或面板高度鏈調整）、`messages/zh-TW.json`／`messages/en.json`（＋`npm run gen:zh-cn`）、`doc/學員手冊.md`（＋另二手冊檔首）、`config/version.json`、`ai-context/03`／`07`、`README-AI.md`
  - 視高度修正方案可能一併調整：`components/conversation/messages-page.tsx` 「訊息」`TabsContent` 的高度容器。
  - 不動：`app/[locale]/(user)/messages/page.tsx`（`getMyFriends` 回傳形狀擴充後自然帶入）、`lib/auth/route-access.ts`、加好友 Drawer、通知。
- **Database**：`friendships` 表新增 `pinnedAt TIMESTAMP NULL`（相容既有資料；`make schema-update`）。
- **Dependencies / Route access / 權限**：皆不變。
- **i18n**：`community` 命名空間新增搜尋 placeholder、查無結果、釘選／取消釘選、分頁指示等 key（`zh-TW` ＋ `en`，再產 `zh-CN`）；`genderMale` / `genderFemale` 保留但好友卡片不再使用。

## Open Questions

- 第 2 點確認：多筆既有對話一律跳「最後訊息時間最新」的一筆；套用所有「傳訊息」入口。**已確認移除既有對話選擇畫面（picker）**——連帶「透過『傳訊息』入口與已有對話的對象再開一筆全新平行對話」的 UI 入口一併移除（資料模型與既存平行對話不受影響）。若日後需保留「開新對話」入口，另開 CR。
- 第 6 點根因未經實機重現定位；design 列出最可能成因與修正方向，實作階段以開發環境 `test2` repro 路徑驗證。
- 搜尋「名稱」比對範圍以「真實姓名／英文名／暱稱＋啟動編號」為準（比照後台會員搜尋，未含 email）；分頁採「上一頁／下一頁＋頁次指示」；搜尋與分頁於 client 端就 `initialFriends` 全量處理（好友數量級小），皆為實作決定。
