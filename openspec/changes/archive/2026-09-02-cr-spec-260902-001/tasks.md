## 1. 加好友介面：Sheet（底部）→ Dialog（置中彈窗）

- [x] 1.1 `git mv components/community/add-friend-drawer.tsx components/community/add-friend-dialog.tsx`
- [x] 1.2 檔首註解：檔名改 `add-friend-dialog.tsx`，日期 `2026-09-02`，補一行 `cr-spec-260902-001：底部 Sheet → 置中 Dialog（彈窗）；開啟時不自動聚焦輸入欄位（手機不彈鍵盤遮 QR）`
- [x] 1.3 import：移除 `Sheet / SheetContent / SheetHeader / SheetTitle`（`@/components/ui/sheet`）；改為 `Dialog / DialogContent / DialogHeader / DialogTitle`（`@/components/ui/dialog`）
- [x] 1.4 `export function AddFriendDrawer` → `export function AddFriendDialog`；`Props` 型別若具名一併更名（`AddFriendDialogProps`），欄位不變（`open / onOpenChange / mySpiritId / onFriendAdded`）
- [x] 1.5 JSX 外層：`<Sheet open onOpenChange>` → `<Dialog open onOpenChange>`；`<SheetContent side="bottom" className="mx-auto max-w-md">` → `<DialogContent className="max-w-sm max-h-[90dvh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>`；`<SheetHeader>/<SheetTitle>` → `<DialogHeader>/<DialogTitle>`（title 內容 `view === 'qr' ? t('myQrTitle') : t('scanToggle')` 不變）
- [x] 1.6 內層容器：移除為 `SheetContent` 補的 `px-4 pb-6`（`DialogContent` 自帶 `p-6`），保留 `space-y-4`；「我的行動條碼」區維持 `flex flex-col items-center gap-2`（QR＋明碼編號水平置中）
- [x] 1.7 `view` state、相機掛載／`!open` reset 兩個 `useEffect`、`handleAdd`、`stopCamera`、`manualBlock`、`parseSpiritId`、`QRCodeCanvas` 動態載入、`QR_PREFIX` 全部不動
- [x] 1.8 掃描檢視 JSX（`<video>` ＋ `cameraError` 區塊含 `manualBlock` ＋「顯示我的行動條碼」鈕）維持現狀

## 2. 開啟彈窗不自動聚焦輸入欄位（手機不彈鍵盤）

- [x] 2.1 `DialogContent` 的 `onOpenAutoFocus={(e) => e.preventDefault()}`（§1.5 已含）——Radix 不主動聚焦子元素，焦點落在 content 容器；focus trap／`Esc`／點遮罩關閉仍正常
- [x] 2.2 確認「輸入啟動編號」`<Input>` 未加 `autoFocus`；不加任何 `ref.focus()`；使用者手動點欄位仍可正常叫出鍵盤打字
- [x] 2.3 掃描檢視 `<video>` 非 tabbable，不受影響

## 3. 元件 import 端：`components/conversation/messages-page.tsx`

- [x] 3.1 `import { AddFriendDrawer } from '@/components/community/add-friend-drawer'` → `import { AddFriendDialog } from '@/components/community/add-friend-dialog'`
- [x] 3.2 JSX `<AddFriendDrawer ... />` → `<AddFriendDialog ... />`（props 不變：`open={addOpen} onOpenChange={setAddOpen} mySpiritId={mySpiritId} onFriendAdded={reloadFriends}`）
- [x] 3.3 檔首註解補一行 `cr-spec-260902-001：加好友介面改置中彈窗（AddFriendDialog）；「傳訊息」入口只開一對一對話（資料層收斂，本檔 openWithUser 不改）`
- [x] 3.4 全庫 grep `add-friend-drawer` / `AddFriendDrawer` 確認無其他引用殘留

## 4. 「傳訊息」入口只鎖定一對一對話：`lib/data/conversation.ts`

- [x] 4.1 `findConversationsWithUser` 的 `where` 於 `AND` 陣列加第三條件：`{ participants: { every: { userId: { in: [viewerId, targetUserId] } } } }`（排除含第三人的對話 → 結果集恰為雙方一對一對話，可多筆）
- [x] 4.2 函式上方註解改為：`會員：與某位對象的「一對一」既有對話（供「傳訊息」入口取最新一筆；SHALL NOT 含雙方共同所屬的群組）`
- [x] 4.3 檔首註解補一行 `cr-spec-260902-001：findConversationsWithUser 收斂為「僅一對一」，避免「傳訊息」跳進共同群組`
- [x] 4.4 `getMyConversations` / `getConversationSummaries` / `previewNewConversationWithUser` / `getConversationMessages` 不動
- [x] 4.5 `app/actions/conversation.ts` `fetchConversationsWithUser` 不改（名稱維持；語意隨資料層收斂）；`messages-page.tsx` `openWithUser` 不改（`candidates` 現只含一對一；`length === 0` → `startNewWithTarget`；否則取 `lastMessageAt` 最新一筆）

## 5. 驗證

- [x] 5.1 `npx eslint components/community/add-friend-dialog.tsx components/conversation/messages-page.tsx lib/data/conversation.ts`：0 error
- [x] 5.2 `npx tsc --noEmit`：0 error
- [x] 5.3 `npm run build`：`✓ Compiled successfully`
- [x] 5.4 **（人工實測）** 桌機：點「加好友」→ 畫面中央彈窗、QR 與明碼編號水平置中；切換掃描／掃碼加好友／關閉釋放相機／手動輸入加好友皆正常；`Esc` 與點遮罩可關閉
- [x] 5.5 **（人工實測）** 手機（DevTools 375px）：點「加好友」→ 彈窗置中、**軟體鍵盤未自動彈出**、QR 完整可見；點「輸入啟動編號」欄位才叫出鍵盤
- [x] 5.6 **（人工實測）** 「傳訊息」（正式情境重現）：與某好友既有一對一對話、且兩人同屬「早安，啟動事工系統工作小組」等群組（群組最後訊息較新）→ 於好友卡片／學員專頁／後台會員／`?with=` 點「傳訊息」皆開啟**一對一**對話，不跳群組
- [x] 5.7 **（人工實測）** 「傳訊息」對「只有共同群組、無一對一對話」的對象 → 進新對話畫面；送出後建立僅雙方兩人的對話
- [x] 5.8 **（人工實測）** 迴歸：訊息頁籤頻道列表仍列出群組並可點開；多筆一對一平行對話仍可各自從頻道列表開啟；非好友仍可互傳訊息；`?tab=` 行為不變

## 6. 文件與版本號（rule 7 / 8 / 9）

- [x] 6.1 `doc/學員手冊.md`〈十五、社群〉「### 加好友」：「點『加好友』會**從畫面下方彈出面板**」→「點『加好友』會在**畫面中央彈出視窗**」；補「手機開啟時不會自動跳出鍵盤，行動條碼 QR 完整可見」。好友卡片「### 傳訊息」／清單說明：明確為「開啟與對方的**個人**對話（不會跳到你們共同所在的群組）」。檔首版本標註＋日期改 `2026-09-02`
- [x] 6.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：檔首更新註記同步（社群加好友改置中彈窗、「傳訊息」只開個人對話、手機不自動彈鍵盤）；無專屬章節則僅改檔首版本＋日期
- [x] 6.3 `config/version.json`：`version` patch +1（`0.1.195` → `0.1.196`）、`updatedAt` = `2026-09-02`
- [x] 6.4 `ai-context/03-architecture.md`：`components/community/add-friend-drawer.tsx` → `add-friend-dialog.tsx`（Sheet→Dialog 置中彈窗）；`lib/data/conversation.ts` `findConversationsWithUser` 註明「限一對一，排除共同群組」
- [x] 6.5 `ai-context/07-current-tasks.md`「已完成」清單最前面追加：`cr-spec-260902-001 社群優化（加好友改置中彈窗＋手機不自動彈鍵盤／「傳訊息」只開一對一對話不跳共同群組）`
- [x] 6.6 `README-AI.md`：版本行更新為 `0.1.196`
