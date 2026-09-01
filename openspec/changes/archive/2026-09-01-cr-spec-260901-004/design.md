## Context

現況（相關切片）：

- **路由與資料**：`app/[locale]/(user)/messages/page.tsx`（server）→ `getMyConversations` ＋ `getMyFriends` → `<MessagesPage>`（`components/conversation/messages-page.tsx`，client）。頁面在 `(user)/layout.tsx` 下：`min-h-screen flex flex-col` 內含 `sticky top-0 h-16` 的 `<Topbar>`、`<main className="flex-1 mx-auto w-full max-w-[1280px] px-4 py-6 sm:p-6">`、非固定的 `<Footer className="py-4">`（版本字串一行）。**沒有任何 `position: fixed`**——所謂「被 footer 蓋住」實為下述固定高度巢狀 + `overflow-hidden` 造成的裁切。
- **`messages-page.tsx` 訊息頁籤**：`<div className="flex h-[calc(100vh-16rem)] min-h-[28rem] overflow-hidden rounded-lg border">`，內含
  - 左側頻道列表 `w-full shrink-0 overflow-y-auto border-r sm:w-80`（`mobileShowThread` 時 `hidden`）。
  - 右側窗格 `flex w-full flex-1 min-w-0 flex-col p-4`（`mobileShowThread` 時才 `flex`）。窗格頂端有 `mb-2 flex items-center gap-2 sm:hidden` 的**獨立返回列**（`IconArrowLeft` ghost 按鈕 → `setMobileShowThread(false)`）。
  - 窗格內三態：`isPicking`（選既有對話 / 開新）｜`selected`（對話資訊框 ＋ `<ConversationThread>`）｜空狀態提示。
  - 「對話資訊框」：`space-y-2 rounded-lg border p-3`，第一列 `flex items-center gap-2`：標題 `<p className="flex-1 truncate …">` → 鉛筆（編輯標題）→ 釘選。
- **`conversation-thread.tsx`**：最外層 `<div className="flex h-[60vh] min-h-[24rem] flex-col gap-4">` → `MessageScrollerProvider` > `MessageScroller className="flex-1 rounded-lg border"` > `Viewport` > `Content` > `Item`（末筆 `scrollAnchor`）→ `MessageScrollerButton`（捲到底）→ 輸入列 `flex gap-2`（`Textarea rows={2}` ＋「送出」`Button`）。
- **Message Scroller 元件**（`components/ui/message-scroller.tsx`）：封裝 `@shadcn/react/message-scroller`（已於 `package.json` `^0.2.1`、已安裝）。`Root` 本身即 `flex size-full min-h-0 flex-col overflow-hidden`；`Viewport` `size-full min-h-0 overflow-y-auto overscroll-contain` 且帶 `scroll-fade-b`。→ **元件本身不需改**，只要給它一個「有界且會壓縮」的父容器即可正確運作。
- **i18n**：`common.back` = 「返回」已存在。`community.*` / `conversation.*` 為既有命名空間。

## Goals / Non-Goals

**Goals：**
- 手機（`< sm`）下「訊息」頁籤：對話串（Message Scroller）與輸入框完整落在可視面板內，**輸入框不被 `Footer` 遮蔽 / 不被裁切**。
- 手機下移除巢狀外框（面板、對話資訊框、Message Scroller 三層 → 手機無框或僅細分隔線）。
- 手機下「返回頻道列表」按鈕位於**對話標題列右端（右上角）**，與標題同一列；移除原本自成一列的返回鍵。
- 桌面（`≥ sm`）版面與所有對話互動邏輯**完全不變**。

**Non-Goals：**
- 不改對話功能任何邏輯（發送、釘選、標題編輯、邀請、選擇既有對話、`?with=` / `?tab=`、未讀）。
- 不改 `components/ui/message-scroller.tsx` 的 API 或樣式。
- 不動 Topbar、`Footer`、`(user)/layout.tsx`。
- 不改「好友」頁籤、`FriendsList`、`AddFriendDrawer`。
- 不新增 npm 套件、不新增 i18n key、不新增路由。
- 不做桌面版視覺調整。

## Decisions

### D1：面板高度改用 `100dvh` 動態視窗高 ＋ 完整 `min-h-0` 鏈

**問題**：`h-[calc(100vh-16rem)]` 固定高 + 內層 `ConversationThread` 再套 `h-[60vh] min-h-[24rem]`，兩個獨立視窗相對高相加超出面板；面板 `overflow-hidden` 把超出的輸入列裁掉。`100vh` 在行動 Chrome/Safari 不含網址列高度，實際可視更矮，裁切更嚴重。

**決策**：
- 訊息頁籤面板改為：手機 `flex h-[calc(100dvh-13rem)] min-h-[24rem] flex-col overflow-hidden`；`sm:` 以上回到 `sm:h-[calc(100vh-16rem)] sm:min-h-[28rem] sm:flex-row`。
  - `100dvh`：動態視窗高，行動瀏覽器網址列收合/展開時自動跟隨，避免固定 `vh` 誤差。
  - `13rem` 扣除量 ≈ Topbar `h-16`(4rem) + `main` `py-6`(3rem) + 頁首「社群＋加好友」列(`text-xl` + `mb-4` ≈ 2.75rem) + `TabsList`(`mb-4` ≈ 3.25rem)。抓略小的扣除量讓面板寧可短一點也不要頂到 `Footer`；精確像素不重要，因為 D1 的 `min-h-0` 鏈才是保證輸入框可見的機制。
- `ConversationThread` 最外層 `h-[60vh] min-h-[24rem]` → `flex min-h-0 flex-1 flex-col gap-4`：高度交給父窗格。
- 補齊 `min-h-0` 鏈，讓「可壓縮的是對話串、不可壓縮的是輸入列」：
  - 右側窗格：`flex w-full flex-1 min-w-0 min-h-0 flex-col …`
  - `selected` 分支容器：`flex min-h-0 flex-1 flex-col gap-3`（現已是，確認保留）
  - `ConversationThread` 呼叫處外層 / 內層 `MessageScroller` 皆 `flex-1 min-h-0`
- 結果：面板高度不足時，被壓縮的是 `MessageScroller` 的 `Viewport`（可捲動），輸入列（`Textarea rows={2}` ＋按鈕）維持自然高度且恆在面板底部之內、`Footer` 之上。

**替代方案（不採）**：把 `Footer` 或輸入列改 `position: fixed`／`sticky`。會牽動 `(user)/layout.tsx` 全站版面與其他頁面，超出本 CR 範圍且風險高。

### D2：外框改 `sm:` 斷點——手機無框

| 元素 | 現況 | 改為 |
| --- | --- | --- |
| 訊息頁籤面板 | `rounded-lg border` | `sm:rounded-lg sm:border`（手機無框） |
| 左側頻道列表容器 | `border-r` | `sm:border-r` |
| 對話資訊框 | `space-y-2 rounded-lg border p-3` | `space-y-2 border-b pb-3 sm:rounded-lg sm:border sm:border-b sm:p-3`（手機：僅底部分隔線、無左右上框、無圓角、`p-0`） |
| `MessageScroller`（於 `conversation-thread.tsx`） | `flex-1 rounded-lg border` | `flex-1 min-h-0 sm:rounded-lg sm:border`（手機靠內建 `scroll-fade-b` 呈現可捲邊界） |

手機下左側頻道列表（未進對話時）是否保留列與列之間的 `border-b`：**保留**（那是清單分隔，非「外框」）。`overflow-hidden` 在面板上保留（配合 `sm:rounded-lg` 裁圓角；手機無框時無視覺影響）。

### D3：返回鍵進標題列右上角

- **移除** `messages-page.tsx` 右側窗格頂端的獨立返回列：
  ```
  <div className="mb-2 flex items-center gap-2 sm:hidden">
    <Button variant="ghost" size="icon" onClick={() => setMobileShowThread(false)}>
      <IconArrowLeft className="h-4 w-4" />
    </Button>
  </div>
  ```
- **`selected` 態**：在「對話資訊框」標題列（`flex items-center gap-2`）末端、釘選鈕之後，加一顆 `sm:hidden` 的返回鈕：
  ```
  <Button variant="ghost" size="icon" className="size-8 sm:hidden"
          aria-label={t('...back')} title={t('...back')}
          onClick={() => setMobileShowThread(false)}>
    <IconArrowLeft className="h-4 w-4" />
  </Button>
  ```
  標題 `<p className="flex-1 truncate">` 的 `flex-1` 會把鉛筆／釘選／返回推到最右 → 返回鍵落在面板右上角、與標題同一列。編輯標題（`editingTitle`）時該列改顯示 `Input` ＋ 勾選鈕，返回鈕同樣附在該列末端（`shrink-0`，維持顯示）。
- **`isPicking` 態與空狀態**：這兩態原本沒有標題可依附。於各自區塊頂端加一列
  ```
  <div className="mb-3 flex items-center justify-between sm:hidden">
    <span className="text-sm text-muted-foreground">{提示文字}</span>
    <Button variant="ghost" size="icon" className="size-8" onClick={() => setMobileShowThread(false)}>
      <IconArrowLeft className="h-4 w-4" />
    </Button>
  </div>
  ```
  維持「返回鍵在右上角」的一致性。
- i18n：`aria-label` / `title` 用既有 `common.back`（元件內以 `useTranslations('common')` 取 `t('back')`，或既有可及的等義 key）。不新增文案。

### D4：Message Scroller 行為驗證

元件與 `scrollAnchor`（末筆訊息）不動；只因父容器變彈性而需回歸驗證：
- 進入對話 → 自動捲到最新訊息（`scrollAnchor`）。
- 送出新訊息 → `messages` 更新後仍自動貼齊底部。
- 往上捲動時 `MessageScrollerButton`（回到底部）出現，點擊捲回底。
- 手機鍵盤彈出（`Textarea` focus）時，`100dvh` 收縮 → 面板變矮、對話串 `Viewport` 壓縮可捲、輸入列仍可見。

## Risks / Trade-offs

- **扣除量 `13rem` 為估算**：不同機型頁首高度略有差異。緩解＝`min-h-0` 鏈讓「壓縮對話串」而非「裁掉輸入框」，且 `100dvh` 已吸收網址列變化；即使估算偏差，最差是面板上下留白略多／略少，不影響可用性。
- **`100dvh` 舊瀏覽器支援**：現代行動瀏覽器（iOS Safari 15.4+／Chrome 108+）皆支援；專案 Next.js 16 + 目標客群為近代行動裝置，可接受。必要時可 `h-[calc(100vh-13rem)] [height:calc(100dvh-13rem)]` 兩行漸進增強。
- **手機無外框後層次感變弱**：以 `bg`／`scroll-fade-b`／分隔線維持可讀性；此為 CR 明確要求（`不要外框`）。
- **與 CR-SPEC-260901-003 的重疊**：003（未封存）已把 `messages-page.tsx` 重構為「好友｜訊息」頁籤並持有 `contact-member` 的 MODIFIED 需求。本 CR 只**新增**一條「訊息頁籤行動裝置版面」需求（ADDED），不改 003 既有需求文字，避免封存時 delta 衝突；程式碼層面則在 003 產生的結構上調整 class。

## Migration Plan

無資料庫 / 無資料遷移。前端版面調整，部署即生效。回滾＝還原兩個元件檔的 class 變更。

## Open Questions

無。
