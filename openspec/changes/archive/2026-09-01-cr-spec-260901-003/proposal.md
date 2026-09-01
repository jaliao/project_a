## Why

需求單 CR-SPEC-260901-003（提出人：廖柏嘉 Justin，2026-09-01）：**「訊息改名為社群」**。原文要點：

- 前台「訊息」改名為「**社群**」，選單 Icon 更換。
- 頁面內容：標題「社群」＋（`＋ 加好友` 按鈕）；頁籤「**好友 | 訊息**」；分別是**好友清單 | 訊息清單**。
- 「加好友」用 **Drawer** 彈出畫面：**行動條碼 | 切換掃描行動條碼**。

使用者澄清（2026-09-01）：
- **好友＝單向即時加入**：掃到 / 輸入對方啟動編號後**直接加入自己的好友清單**，不需對方同意、無邀請/接受流程。
- **路由沿用 `/messages`**，只改 UI 文字與 icon（不新增 `/community` 路由）。
- 「切換掃描行動條碼」本次要做**完整三件事**：①我的行動條碼（QR）②手動輸入啟動編號加好友 ③相機即時掃碼。
- 好友**不改變傳訊息權限**：維持「任何登入會員可對任何會員發訊息」，好友清單只是「快速開對話」的捷徑（點好友＝等同 `/messages?with={userId}`）。

## What Changes

### 1. 資料模型：`Friendship`（新表，單向）

- 新檔 `prisma/schema/friendship.prisma`：`Friendship { id, ownerId, friendId, createdAt, @@unique([ownerId, friendId]) }`，`owner`／`friend` 皆關聯 `User`（`onDelete: Cascade`），`@@index([ownerId])`。
- `User` 新增反向關聯 `friendshipsOwned Friendship[] @relation("FriendshipOwner")`、`friendshipsAsFriend Friendship[] @relation("FriendshipFriend")`。
- Migration `add_friendship`：**純新增表**，與既有正式資料相容（不動既有欄位）。
- 單向語意：A 加 B，只有 A 的好友清單出現 B；B 要看到 A 需自己另外加。

### 2. 資料層：`lib/data/friendship.ts`

- `getMyFriends(userId)` → 依 `createdAt` 倒序回傳 `{ userId, spiritId, displayName, avatarUrl, addedAt }[]`（用 `getMemberDisplayName` 組顯示名）。
- `isFriend(ownerId, friendId)` → boolean。

### 3. Server Actions：`app/actions/friendship.ts`

- `addFriendBySpiritId(spiritId: string)`：正規化 `spiritId.trim().toUpperCase()` → 查 `User`；查無 → `{ success:false, message:'找不到該啟動編號對應的會員' }`；等於自己 → `{ success:false, message:'無法加自己為好友' }`；已是好友 → 視為成功（idempotent，不重複建立）；否則建 `Friendship` 並 fire-and-forget `createNotification(friendUserId, '有人加你為社群好友', '{對方顯示名} 已將你加入社群好友。')`。回傳 `{ success, message, friendUserId }`。
- `removeFriend(friendUserId: string)`：刪除 `ownerId = 我 / friendId = 對方` 的 `Friendship`（無則視為成功）。
- `fetchMyFriends()`：`getMyFriends(currentUserId)`（給 client tab 重整用）。
- 全部先 `auth()` 驗證登入。

### 4. 頁面：`/messages` → 「社群」頁（沿用路由）

- `app/[locale]/(user)/messages/page.tsx`：改抓 `getMyFriends(userId)` 一併傳入；`metadata.title`「訊息 …」→「社群 …」。
- `components/conversation/messages-page.tsx` → 重構為「社群」容器：
  - 頁首：標題 `community.title`（社群）＋ 右側「`＋ 加好友`」按鈕（開 `AddFriendDrawer`）。
  - **頁籤（Tabs）**：`好友` | `訊息`（i18n `community.tabFriends` / `community.tabMessages`）。以 `?tab=friends|messages` 記錄；預設 `friends`；**帶 `?with=` 時強制 `messages` 分頁**並沿用既有「選擇既有對話 / 開新對話」行為。
  - `訊息` 分頁：**完全沿用**現有頻道列表 ＋ 對話視圖（釘選排序、未讀、群組、標題編輯、邀請、窄螢幕切換）不變。
  - `好友` 分頁：好友清單，每列頭像＋顯示名＋啟動編號；**點一列＝開啟與該好友的對話**（等同現有 `?with={userId}` 流程：切到 `訊息` 分頁、有既有對話則選擇、否則開新對話）；每列有「移除」（`AlertDialog` 確認 → `removeFriend`）。空狀態 `community.friendsEmpty`。

### 5. 加好友 Drawer：`components/community/add-friend-drawer.tsx`

- 用既有 `components/ui/sheet.tsx`（`side="bottom"` 或 `right`，比照專案 Drawer 慣例）。兩個檢視、以「切換」按鈕互切：
  - **我的行動條碼**（預設）：顯示本人 `spiritId` 的 QR（`qrcode.react` 的 `QRCodeCanvas`，payload = `spiritfriend:{spiritId}`）＋ 明碼 `spiritId` 文字；下方「手動輸入啟動編號」`Input` ＋「加入」按鈕 → `addFriendBySpiritId`；「切換掃描行動條碼」按鈕切到掃描檢視。
  - **掃描行動條碼**：相機即時掃碼（`@zxing/browser` 的 `BrowserQRCodeReader`，`decodeFromVideoDevice`）；掃到 `spiritfriend:{spiritId}`（或純 `spiritId` 字串亦接受）→ 解析出 `spiritId` → 呼叫 `addFriendBySpiritId` → toast 結果 → 停鏡頭、切回我的行動條碼並重整好友清單。相機權限被拒 / 裝置不支援 → 顯示提示並回退到「手動輸入啟動編號」。「切換」按鈕切回我的行動條碼。
  - 關閉 Drawer SHALL 釋放相機（`reader.reset()` / 停止 track）。
- 兩套件皆 client-only、`dynamic(() => import(...), { ssr:false })` 動態載入，避免進首屏 bundle。

### 6. Topbar：訊息 → 社群（改名＋換 icon，路由不變）

- `components/layout/topbar.tsx`：`messages` 項目的 `icon` 由 `IconMessage` 改為 `IconUsersGroup`（Tabler），`label` 由 `t('messages')` 改為 `t('community')`；`onClick` 仍導向 `/messages`；未讀角標（`unreadMessageCount`）行為不變。桌機按鈕與手機選單皆同步。
- i18n：`messages/zh-TW.json` 新增 `nav.community`「社群」（`messages/en.json`：`Community`）；`nav.messages` key 保留不動（避免其他潛在引用斷裂，僅 topbar 改用新 key）。

### 7. i18n：新增 `community` 命名空間

`messages/zh-TW.json` 新增 `community.*`（`title`／`addFriend`／`tabFriends`／`tabMessages`／`friendsEmpty`／`myQrTitle`／`myQrHint`／`scanToggle`／`scanBackToQr`／`manualLabel`／`manualPlaceholder`／`add`／`addSelfError`／`notFoundError`／`added`／`alreadyFriend`／`removeFriend`／`removeConfirm`／`cameraDenied`／`cameraUnsupported`…）＋ `messages/en.json` 對應；`npm run gen:zh-cn` 重產簡體。

### 8. 文件與版本號

- `doc/學員手冊.md`：「訊息」章節更名「社群」，補「好友」頁籤與「加好友（行動條碼 / 掃碼 / 輸入啟動編號）」；`doc/管理者操作手冊.md`／`doc/老師手冊.md` 頂部工具列按鈕列表「訊息」→「社群」。各檔檔首版本＋日期。
- `config/version.json` patch +1、`updatedAt` 當日。
- `ai-context/03-architecture.md`（`friendship.prisma`、`app/actions/friendship.ts`、`lib/data/friendship.ts`、社群頁頁籤、Topbar 條目）、`ai-context/04-data-model.md`（`Friendship`）、`07-current-tasks.md` 追加；`README-AI.md` 版本行。

## Capabilities

### Modified Capabilities
- `contact-member`：Topbar「訊息」入口更名為「社群」並更換 icon（路由 `/messages` 不變）；`/messages` 頁改為「社群」頁——頁首含標題與「加好友」按鈕、內容分「好友 | 訊息」兩頁籤，「訊息」頁籤沿用既有對話功能，新增「好友」頁籤（好友清單、點列開啟對話、移除好友）。
- `topbar`：桌機按鈕群與手機選單中的「訊息」項目顯示文字改為「社群」、圖示更換（導向與未讀角標行為不變）。

### Added Capabilities
- `community-friends`：單向好友關係（`Friendship` 資料模型）；以啟動編號加好友（手動輸入 / 掃描對方行動條碼 / 對方掃我的行動條碼），即時加入、免對方同意、可移除；加好友 Drawer（我的行動條碼／相機即時掃碼／手動輸入切換）；好友清單頁籤與「點好友即開對話」捷徑；加好友後通知對方；好友關係不影響傳訊息權限。

## Impact

- **Affected code**：
  - 新增：`prisma/schema/friendship.prisma`、`prisma/migrations/*_add_friendship/`、`lib/data/friendship.ts`、`app/actions/friendship.ts`、`components/community/add-friend-drawer.tsx`、`components/community/friends-list.tsx`
  - 修改：`app/[locale]/(user)/messages/page.tsx`、`components/conversation/messages-page.tsx`（→ 社群容器＋頁籤）、`components/layout/topbar.tsx`、`prisma/schema/user.prisma`（`Friendship` 反向關聯）、`messages/zh-TW.json`／`messages/en.json`、`doc/學員手冊.md`／`doc/管理者操作手冊.md`／`doc/老師手冊.md`、`config/version.json`、`ai-context/03-architecture.md`／`04-data-model.md`／`07-current-tasks.md`、`README-AI.md`
  - 產生：`messages/zh-CN.json`
- **Database**：新增 `friendships` 表（migration `add_friendship`）。**純新增**、additive，與正式資料相容；無破壞性變更。
- **Dependencies**：新增 npm 套件 `qrcode.react`（QR 產生）與 `@zxing/browser`（＋ `@zxing/library` 依賴，QR 掃描）。安裝需 `--legacy-peer-deps`。兩者皆 client-only、動態載入。
- **Route access**：`/messages` 已是需登入頁，沿用；無新增免登入路由。
- **權限**：不變——傳訊息仍為「任何登入會員對任何會員」；好友為個人化清單。
- **i18n**：新增 `nav.community` 與 `community.*` 命名空間；`nav.messages` key 保留。

## Open Questions

- 無。好友模型（單向即時）、路由（沿用 `/messages`）、掃碼範圍（我的 QR＋手動輸入＋相機掃碼）、權限（不變）皆已由使用者確認。行動條碼 payload 採 `spiritfriend:{spiritId}`（掃描端同時接受純 `spiritId` 字串）為實作決定。
