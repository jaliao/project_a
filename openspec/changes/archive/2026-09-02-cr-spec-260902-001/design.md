## Context

現況（cr-spec-260901-003 / 004 / 007 已封存並上線）：

- **`components/community/add-friend-drawer.tsx`**（client，`'use client'`）
  ```tsx
  export function AddFriendDrawer({ open, onOpenChange, mySpiritId, onFriendAdded }: Props)
  // Sheet(open, onOpenChange) > SheetContent side="bottom" className="mx-auto max-w-md"
  //   SheetHeader > SheetTitle{ view==='qr' ? t('myQrTitle') : t('scanToggle') }
  //   view==='qr':
  //     flex flex-col items-center gap-2 → [white p-3 rounded-lg > QRCodeCanvas value=`spiritfriend:${id}` size=200]
  //                                        + <p font-mono>{mySpiritId}</p> + <p>{t('myQrHint')}</p>
  //     border-t pt-4 > manualBlock（label + <Input value={manual}> + <Button>{t('add')}</Button>）
  //     <Button variant="outline" w-full onClick={() => setView('scan')}>{t('scanToggle')}</Button>
  //   view==='scan': <video> + cameraError 區塊(含 manualBlock) + <Button>{t('scanBackToQr')}</Button>
  // useEffect：open&&view==='scan' 掛載 @zxing/browser 相機；cleanup stopCamera()
  // useEffect：!open → stopCamera() + setView('qr') + reset
  // handleAdd(raw)：parseSpiritId → addFriendBySpiritId → toast → onFriendAdded()；view==='scan' 時 stopCamera()+setView('qr')
  ```
  `Sheet`／`SheetContent` = `components/ui/sheet.tsx`，底層 `radix-ui` 的 `Dialog`；`SheetContent` 以 `{...props}` 透傳。

- **`components/ui/dialog.tsx`**：`Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` 皆 shadcn 標準；`DialogContent` 底層 `DialogPrimitive.Content`（`radix-ui` `Dialog`），`{...props}` 透傳 → 可接 `onOpenAutoFocus` / `onCloseAutoFocus`。預設樣式已置中（`fixed top-[50%] left-[50%] translate-[-50%]`、`max-w-lg`）。

- **`components/conversation/messages-page.tsx`**（client）
  - `import { AddFriendDrawer } from '@/components/community/add-friend-drawer'`；`<AddFriendDrawer open={addOpen} onOpenChange={setAddOpen} mySpiritId={mySpiritId} onFriendAdded={reloadFriends} />`。
  - `openWithUser(targetUserId)`：`const candidates = await fetchConversationsWithUser(targetUserId)`；`candidates.length === 0` → `startNewWithTarget`；否則 `const latest = [...candidates].sort((a,b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())[0]; selectConversation(latest.id)`。
  - `useEffect([initialWithUserId])` → `openWithUser(initialWithUserId)`；「好友」卡片 `onOpenConversation={(uid) => { changeTab('messages'); openWithUser(uid) }}`。

- **`app/actions/conversation.ts`**：`fetchConversationsWithUser(targetUserId)` → `auth()` → `findConversationsWithUser(session.user.id, targetUserId)`。

- **`lib/data/conversation.ts`**
  ```ts
  async function getConversationSummaries(userId, where: Prisma.ConversationWhereInput): Promise<ConversationSummary[]>
  // select participants { userId, lastReadAt, pinnedAt, user{…} } / messages(take 1)
  // 回傳 isGroup: otherParticipants.length > 1、lastMessageAt、displayTitle…；未特別排序

  export async function findConversationsWithUser(viewerId, targetUserId): Promise<ConversationSummary[]> {
    return getConversationSummaries(viewerId, {
      AND: [
        { participants: { some: { userId: viewerId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    })
  }
  ```
  同一對象間可有多筆各自獨立對話（`contact-member` 規格）；此函式目前把「雙方共同所屬的群組」也算進來。

- **`?with=` 深連結來源**：`components/conversation/send-message-button.tsx`（`router.push('/messages?with=' + targetUserId)`）、`components/admin/member-tag.tsx`（同）。皆最終走 `messages-page.tsx` `openWithUser`。

- **手冊**：`doc/學員手冊.md`〈十五、社群〉「### 加好友」段：「點『加好友』會**從畫面下方彈出面板**…」。`doc/老師手冊.md`／`doc/管理者操作手冊.md` 檔首更新註記提及社群優化。

## Goals / Non-Goals

**Goals**
1. 加好友介面由「底部滑出面板（Sheet）」改為「置中彈窗（Dialog）」，「我的行動條碼」QR 與明碼編號顯示於畫面中央、水平置中。
2. 彈窗開啟時不自動聚焦任何文字輸入欄位（行動裝置不自動彈出軟體鍵盤遮擋 QR）。
3. 所有「傳訊息」入口（好友卡片、學員專頁、後台會員、`?with=` 深連結）只開啟／接續與對方的**一對一**對話，不再落入雙方共同所屬的群組。

**Non-Goals**
- 不改加好友的三種方式（我的行動條碼／掃碼／手動輸入啟動編號）、加好友即時生效與通知、相機掛載／釋放邏輯。
- 不改單向好友模型、移除／釘選好友、好友搜尋／分頁、傳訊息授權（非好友仍可互傳）。
- 不改訊息頁籤既有版面／互動、群組對話建立與成員管理、頻道列表（群組仍照常列出、可開啟）。
- 不改 `startConversation` / `previewNewConversationWithUser`（新一對一對話流程本就正確）。
- 不做伺服器端「取唯一一對一對話」的去重（保留「多筆平行一對一對話」能力，仍取最新一筆）。

## Decisions

### D1 — 加好友介面：Sheet（底部）→ Dialog（置中彈窗），並更名檔案

**更名**：`components/community/add-friend-drawer.tsx` → `components/community/add-friend-dialog.tsx`；`export function AddFriendDrawer` → `export function AddFriendDialog`（Props 型別 `AddFriendDialogProps` 或維持 inline）。唯一 import 端 `messages-page.tsx` 同步改名。理由：語意已非 drawer，保留舊名對後續維護誤導；import 端僅 1 處，更名成本低。

**元件內容改寫**（行為不變，只換容器）：
```tsx
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-w-sm"
      onOpenAutoFocus={(e) => e.preventDefault()}   // D2
    >
      <DialogHeader>
        <DialogTitle>{view === 'qr' ? t('myQrTitle') : t('scanToggle')}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {view === 'qr' ? (
          <>
            <div className="flex flex-col items-center gap-2">
              {mySpiritId ? (
                <>
                  <div className="rounded-lg bg-white p-3">
                    <QRCodeCanvas value={`${QR_PREFIX}${mySpiritId}`} size={200} />
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">{mySpiritId}</p>
                  <p className="text-xs text-muted-foreground">{t('myQrHint')}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('myQrHint')}</p>
              )}
            </div>
            <div className="border-t pt-4">{manualBlock}</div>
            <Button variant="outline" className="w-full" onClick={() => setView('scan')}>
              <IconScan className="mr-2 h-4 w-4" />{t('scanToggle')}
            </Button>
          </>
        ) : (
          /* scan 檢視：<video> + cameraError(含 manualBlock) + 「顯示我的行動條碼」鈕，維持現狀 */
        )}
      </div>
    </DialogContent>
  </Dialog>
)
```
- `DialogContent` 預設 `fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]` → 彈窗置中；內層 `flex flex-col items-center` → QR／編號水平置中。原 `SheetContent` 的 `mx-auto max-w-md` 由 `DialogContent className="max-w-sm"`（QR 200px＋左右 padding，`sm`=24rem 足夠）取代。
- 移除 `px-4 pb-6` 這類為 `SheetContent` 補的內距（`DialogContent` 自帶 `p-6`）。
- `Sheet`／`SheetHeader`／`SheetTitle`／`SheetContent` 相關 import 移除。
- `useState<'qr' | 'scan'>('qr')`、`useEffect`（相機掛載／`!open` reset）、`handleAdd`、`stopCamera`、`manualBlock`、`parseSpiritId`、`QRCodeCanvas` 動態載入等**全部不動**。
- `!open` reset effect 已 `setView('qr')`，關閉後再開仍回「我的行動條碼」→ 置中彈窗每次開啟即中央顯示 QR。

### D2 — 開啟時不自動聚焦輸入欄位

Radix `Dialog.Content` 開啟時預設觸發 `onOpenAutoFocus`，把焦點移到內容區第一個可 tabbable 元素（此處＝「輸入啟動編號」`<Input>`）→ 行動瀏覽器彈出軟體鍵盤蓋住 QR。

**做法**：`<DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>`。
- `preventDefault()` 後 Radix 不主動聚焦任何子元素，焦點落在 `DialogContent` 容器本身（Radix 對 content 設 `tabIndex=-1` 可程式聚焦），焦點鎖（focus trap）與 `Esc`／點遮罩關閉仍正常。
- 使用者仍可手動點「輸入啟動編號」欄位打字；掃描檢視也不受影響（`<video>` 非 tabbable，本就不會被聚焦）。
- `onCloseAutoFocus` 不特別處理（預設把焦點還給觸發鈕「加好友」，合理）。
- 不用 `autoFocus` 屬性或 `ref.blur()` hack —— `onOpenAutoFocus` preventDefault 是 Radix 官方建議做法，最穩定。

### D3 — 「傳訊息」入口只鎖定一對一對話

**`lib/data/conversation.ts` `findConversationsWithUser` 的 `where` 增補「不含第三人」條件**：
```ts
export async function findConversationsWithUser(viewerId: string, targetUserId: string): Promise<ConversationSummary[]> {
  return getConversationSummaries(viewerId, {
    AND: [
      { participants: { some: { userId: viewerId } } },
      { participants: { some: { userId: targetUserId } } },
      // 只取「參與者集合恰為 {viewer, target}」的一對一對話，排除雙方共同所屬的群組
      { participants: { every: { userId: { in: [viewerId, targetUserId] } } } },
    ],
  })
}
```
- 前兩個 `some` 保證兩人都在；第三個 `every`（等價 `NOT: { participants: { some: { userId: { notIn: [viewerId, targetUserId] } } } }`）保證沒有第三人 → 結果集恰為雙方一對一對話（可為多筆各自獨立的一對一對話）。
- `viewerId === targetUserId` 不會發生（「傳訊息」入口不對自己開；學員專頁本人頁不顯示按鈕）。
- 空對話（剛 `startConversation` 尚無訊息）仍會被撈到（有 `lastMessageAt` 預設值），與現狀一致。

**下游不需改**：
- `messages-page.tsx` `openWithUser`：`candidates` 現在只含一對一對話；`candidates.length === 0` → `startNewWithTarget`（建立兩人新對話）；`≥ 1` → 取 `lastMessageAt` 最新一筆 `selectConversation`。行為即為「開個人對話、不跳群組」。**程式碼零改動**（純資料層收斂）。
- `?with=` 深連結、好友卡片「傳訊息」皆共用 `openWithUser` → 一致生效。

**命名**：函式名 `findConversationsWithUser` / action `fetchConversationsWithUser` 維持不變（縮小 diff），以註解與 spec 明確「限一對一」語意。

**`getMyConversations` / 頻道列表不受影響**：頻道列表用 `getMyConversations`（`where { participants: { some: { userId } } }`），群組照常列出、可點開。僅「傳訊息」捷徑改走一對一。

### D4 — 文件與版本（於 /opsx:apply 執行）

- `doc/學員手冊.md`〈十五、社群〉「### 加好友」：「從畫面下方彈出面板」→「畫面中央彈出視窗」；補一句「手機開啟時不會自動跳出鍵盤，QR 條碼完整可見」。「### 傳訊息」／好友卡片「傳訊息」描述：明確為「開啟與對方的**個人**對話（不會跳到你們共同所在的群組）」。檔首版本標註＋日期改當日。
- `doc/老師手冊.md`／`doc/管理者操作手冊.md`：檔首更新註記同步（社群加好友改置中彈窗、「傳訊息」只開個人對話）；若無專屬章節則僅改檔首版本＋日期（rule 9）。
- `config/version.json`：patch +1（`0.1.195` → `0.1.196`）、`updatedAt` = 當日。
- `ai-context/03-architecture.md`：`components/community/add-friend-drawer.tsx` → `add-friend-dialog.tsx`（Sheet→Dialog）；`lib/data/conversation.ts` `findConversationsWithUser` 註明「限一對一」。
- `ai-context/07-current-tasks.md`「已完成」最前面追加本 CR 一行。
- `README-AI.md`：版本行更新。

## Risks / Trade-offs

- **Dialog 在極小視窗 + 軟體鍵盤**：置中彈窗高度含 QR 200px＋手動輸入區，`DialogContent` 預設不捲動。若使用者手動點輸入欄位叫出鍵盤，彈窗可能被鍵盤推擠。緩解：`DialogContent` 加 `max-h-[90dvh] overflow-y-auto`（保險，不影響一般情形）。QR 為主視覺，預設不聚焦輸入 → 一般情境鍵盤不出現。
- **`onOpenAutoFocus` preventDefault 的無障礙**：焦點落在 content 容器而非首個控制項，鍵盤使用者需 Tab 一次才到第一個按鈕；Radix focus trap 仍運作、`Esc` 可關 → 可接受，且行動裝置遮擋問題優先。
- **`every` 條件的查詢語意**：Prisma `participants: { every: {...} }` 對「無參與者」的對話也成立，但實務上每個 `Conversation` 建立即含 ≥ 2 participants，且已有兩個 `some` 保證下限 → 無誤撈風險。
- **多筆平行一對一對話**：仍可能存在（規格允許）；「傳訊息」取最新一筆，其餘可從頻道列表開啟——與 cr-spec-260901-007 既定行為一致，本 CR 不變。
- **既有使用者習慣**：先前「傳訊息」曾跳進群組者，改版後會改開個人對話；屬修正非退步，需於手冊與更新註記說明。
- **更名檔案的 git 追蹤**：`git mv` 保留歷史；一次性、低風險。

## Migration Plan

1. `git mv components/community/add-friend-drawer.tsx components/community/add-friend-dialog.tsx`，改寫元件（Sheet→Dialog、`onOpenAutoFocus`、export 更名）。
2. `messages-page.tsx` 改 import `AddFriendDialog` from `@/components/community/add-friend-dialog`，JSX 標籤更名。
3. `lib/data/conversation.ts` `findConversationsWithUser` where 加 `every` 條件 ＋ 檔首／函式註解。
4. `npx eslint` 相關檔 ＋ `npx tsc --noEmit` ＋ `npm run build`。
5. 手冊三份、`config/version.json`、`ai-context/`、`README-AI.md` 更新（rule 7 / 8 / 9）。
6. 無 DB migration；部署即生效。回滾＝還原上述檔案（含 `git mv` 反向）。

## Open Questions

無。三點需求明確；第 1 點以 shadcn `Dialog` 置中、第 2 點以 `onOpenAutoFocus` preventDefault、第 3 點以資料層 `where` 收斂為一對一，皆為既有元件／查詢的最小調整。
