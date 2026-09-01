## Why

需求單 CR-SPEC-260901-005（提出人：廖柏嘉 Justin，2026-09-01）：**「社群好友清單」**。原文：

- **卡片呈現**。
- **卡片內容**：
  - 顯示名稱（性別）
  - 單位
  - 身分別
- **卡片功能** ｜ 傳訊息 ｜ 刪除

使用者澄清（2026-09-01）：
- **身分別＝比照後台「會員管理」的「身分」**：把該會員 `roles` 陣列每一個角色都以標籤列出（`user`→「一般會員」、`teacher_1~3`→「啟動靈人／豐盛／得勝講師」、`admin`→「管理者」、`superadmin`→「超級管理者」），不做「學員／講師」二分、不退回身分標籤（identity-tags）那套。
- **版面＝響應式格狀**：手機 1 欄、桌機 2–3 欄。

現況（cr-spec-260901-003 已上線並封存）：

- 社群頁「好友」頁籤由 `components/community/friends-list.tsx` 呈現——目前是**清單列**（`divide-y rounded-lg border` 容器，每列：頭像＋顯示名稱＋啟動編號，整列可點＝開對話，右側「⋮」→ `AlertDialog` 確認移除）。
- 資料來源 `lib/data/friendship.ts` `getMyFriends(userId)` → `FriendListItem { userId, spiritId, displayName, avatarUrl, addedAt }`（`app/[locale]/(user)/messages/page.tsx` SSR 帶入、`app/actions/friendship.ts` `fetchMyFriends()` 供 client 重整）。
- `components/conversation/messages-page.tsx` 的「好友」`TabsContent` 傳 `friends` / `onOpenConversation`（切到「訊息」頁籤跑既有 `openWithUser`）/ `onRemoved`（重抓好友）。

本 CR ＝**把「好友」頁籤的清單列改成資訊卡片**，補上「性別 / 單位 / 身分別」三項內容，並把互動由「整列點擊＋⋮ 選單」改為卡片內兩顆明確按鈕「傳訊息」「刪除」。加好友流程、單向好友模型、通知、傳訊息權限、`?with=` 深連結等皆不變。

## What Changes

### 1. 資料層：`lib/data/friendship.ts` 擴充 `FriendListItem`

`getMyFriends(userId)` 的 `select` 於 `friend` 內補：`gender`、`roles`、`churchType`、`churchOther`、`church: { select: { name: true } }`。

`FriendListItem` 型別新增：
- `gender: Gender`（`'male' | 'female' | 'unspecified'`）
- `unitLabel: string | null`（單位文字：`churchType==='church'` → `church.name`；`churchType==='other'` → `churchOther`；否則 `null`）
- `roles: UserRole[]`（原樣帶出，供卡片比照後台會員管理逐一顯示）

`.map` 對應補三個欄位；`churchType`/`churchOther`/`church` 只是推導 `unitLabel` 的來源，不直接進型別。既有欄位（`userId`/`spiritId`/`displayName`/`avatarUrl`/`addedAt`）與排序（`createdAt desc`）不變。

### 2. 頁面：`app/[locale]/(user)/messages/page.tsx`

無需改動——`getMyFriends` 回傳形狀擴充後自然帶入 `initialFriends`；`app/actions/friendship.ts` `fetchMyFriends()` 亦透傳同一函式，client 重整即拿到新欄位。

### 3. 元件：`components/community/friends-list.tsx` 改為卡片格狀

- 容器：`divide-y rounded-lg border` 清單 → **響應式 grid**：`grid gap-3 sm:grid-cols-2 lg:grid-cols-3`（手機 1 欄、`sm` 2 欄、`lg` 3 欄）。空狀態（`friendsEmpty`）維持不變。
- 每張卡片：`rounded-lg border p-4`，內容：
  - **頂部**：`UserAvatar` ＋「**顯示名稱（性別）**」——性別為 `male`/`female` 時以 `（男）`/`（女）` 附於顯示名稱後；`unspecified` 時省略括號。下方維持啟動編號（`font-mono text-xs text-muted-foreground`，若有）。
  - **單位**：`unitLabel ?? '—'`（`text-sm`）。
  - **身分別**：`roles.map` → 每個角色一顆 `Badge variant="secondary"`，標籤取 i18n `role` 命名空間（`t(role)`，值同後台 `ROLE_LABELS`）；與後台「會員管理」列表「身分」欄一致（含基線 `user`→「一般會員」）。
  - **卡片功能列**（`flex gap-2`，置卡片底部）：
    - 「**傳訊息**」按鈕（`variant="outline"` 或 `default`，`IconMessage`）→ `onOpenConversation(f.userId)`（沿用既有：切到「訊息」頁籤、跑 `openWithUser`）。
    - 「**刪除**」按鈕（`variant="ghost"` destructive 語氣，`IconTrash`）→ 既有 `AlertDialog` 確認（標題 `removeConfirm`、Cancel `common.cancel`、Action `removeFriend` → `removeFriend(f.userId)` → `onRemoved()`）。
- **移除**「整張卡片可點擊開對話」與右上「⋮」下拉——改由「傳訊息」按鈕承擔開對話、「刪除」按鈕直接呈現於卡面（不藏在選單）。
- props（`friends` / `onOpenConversation` / `onRemoved`）與呼叫端 `messages-page.tsx` 不變。

### 4. i18n

`messages/zh-TW.json` `community` 命名空間新增：
- `cardMessage`「傳訊息」
- `cardDelete`「刪除」（或直接用既有 `common.delete`；本 CR 採 `common.delete` 以免重複，故實際只新增下列性別 key）
- `genderMale`「男」、`genderFemale`「女」

`messages/en.json` 補對應英文；`npm run gen:zh-cn` 重產簡體。`role` 命名空間已存在（`user`/`teacher_1~3`/`admin`/`superadmin`），本 CR 直接取用不新增。

### 5. 文件與版本號

- `doc/學員手冊.md`〈十五、社群〉「好友頁籤」段：把「列出您加入的好友（頭像、顯示名稱、啟動編號）…每列右側的『⋮』可移除好友」改寫為「以**卡片**列出每位好友：顯示名稱（性別）、單位、身分別；卡片上有『傳訊息』與『刪除』兩個按鈕」。檔首版本＋日期。
- `doc/老師手冊.md`／`doc/管理者操作手冊.md`：無好友頁籤操作細節章節 → 內容不動；檔首版本比照 rule 9 同步。
- `config/version.json`：patch +1、`updatedAt` 當日。
- `ai-context/03-architecture.md`（`friendship.ts` `getMyFriends` 欄位、社群「好友」頁籤卡片）、`ai-context/07-current-tasks.md`（「已完成」最前面追加本 CR）；`README-AI.md` 版本行。

## Capabilities

### Modified Capabilities

- `community-friends`：「好友清單頁籤」需求由「清單列（頭像＋顯示名稱＋啟動編號、整列可點開對話、右側移除）」改為「**資訊卡片格狀**（響應式：手機 1 欄／桌機 2–3 欄），每張卡顯示頭像、顯示名稱（性別）、單位、身分別（比照後台會員管理，`roles` 逐一標籤），並提供『傳訊息』與『刪除』兩個卡面按鈕」。排序（加入時間新到舊）、空狀態、開對話流程（切「訊息」頁籤走既有 `?with=` 行為）、移除行為（單向、不通知對方）皆不變。

## Impact

- **Affected code**：
  - 修改：`lib/data/friendship.ts`（`FriendListItem` ＋ `getMyFriends` select/map）、`components/community/friends-list.tsx`（清單 → 卡片格狀）、`messages/zh-TW.json`／`messages/en.json`（＋產生 `zh-CN.json`）、`doc/學員手冊.md`（＋視情況另二手冊檔首）、`config/version.json`、`ai-context/03`／`07`、`README-AI.md`
  - 不動：`app/[locale]/(user)/messages/page.tsx`、`components/conversation/messages-page.tsx`、`app/actions/friendship.ts`、`prisma/schema/*`
- **Database**：無（`gender`/`roles`/`churchType`/`churchOther`/`church` 皆為 `User` 既有欄位）。
- **Dependencies / Route access / 權限**：皆不變。
- **i18n**：`community` 命名空間新增 `genderMale`／`genderFemale`（＋視採用與否 `cardMessage`／`cardDelete`）；`role` 命名空間沿用。

## Open Questions

- 無。身分別語意（比照後台會員管理、`roles` 逐一標籤）與版面（響應式格狀 手機 1／桌機 2–3 欄）已由使用者確認。性別 `unspecified` 省略括號、單位無值顯示「—」為實作決定。
