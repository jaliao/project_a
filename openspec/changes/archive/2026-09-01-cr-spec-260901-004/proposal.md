## Why

需求單 CR-SPEC-260901-004（提出人：廖柏嘉 Justin，2026-09-01）：**「訊息頁面 手機板優化」**。原文要點：

- 幫我導入 `https://ui.shadcn.com/docs/components/base/message-scroller` 的技術。
- 在手機上面：
  - 排版 **message scroller 不要被 footer 蓋住**。
  - **不要外框**。
  - 「上一頁」（返回）**放在右上角，和標題同一列**。

現況（相關切片）：

- **Message Scroller 已導入**：`@shadcn/react` 已是相依套件（`package.json`），`components/ui/message-scroller.tsx` 已封裝 `@shadcn/react/message-scroller`（Provider / Root / Viewport / Content / Item / Button），且 `components/conversation/conversation-thread.tsx`（「訊息」頁籤的對話串）已改用它。本 CR 不再「導入」，而是**修正它在行動裝置上的容器版面**，讓 CR 描述的三個問題成立。
- **問題一（被 Footer 蓋住）**：`ConversationThread` 最外層固定 `h-[60vh] min-h-[24rem]`，巢狀於 `messages-page.tsx` 訊息頁籤面板的 `h-[calc(100vh-16rem)] overflow-hidden` 之中。手機上「對話資訊框（標題／成員／邀請）＋ 60vh 對話串 ＋ 輸入列」總高超過面板高度，被 `overflow-hidden` 裁掉 → 底部的輸入框（`Textarea` ＋「送出」）被切到看不見或貼在頁尾之上，視覺上就是「被 footer 蓋住」。`100vh` 未計入行動瀏覽器動態網址列，誤差更大。
- **問題二（外框）**：手機上有三層巢狀外框——訊息頁籤面板 `rounded-lg border`、對話資訊框 `rounded-lg border`、`MessageScroller` `rounded-lg border`——窄螢幕下顯得擁擠。
- **問題三（返回鍵位置）**：目前返回鍵在右側窗格頂端**自成一列**（`components/conversation/messages-page.tsx` 內 `mb-2 flex … sm:hidden` 的 `IconArrowLeft` ghost 按鈕），不在標題列，也不在右上角。

本 CR ＝**純前端版面優化**，只動「訊息」頁籤在窄螢幕（手機）下的排版；對話功能邏輯、桌面版版面、「好友」頁籤、Topbar、`?with=` / `?tab=` 行為皆不變。

## What Changes

### 1. `components/conversation/conversation-thread.tsx`：改為彈性填滿、不用固定視窗高

- 最外層 `div` 由 `flex h-[60vh] min-h-[24rem] flex-col gap-4` 改為 `flex min-h-0 flex-1 flex-col gap-4`——高度改由父容器（訊息頁籤面板的彈性版面）決定，不再自訂 `60vh`。
- `MessageScroller` 的 `className` 由 `flex-1 rounded-lg border` 改為 `flex-1 rounded-lg border sm:rounded-lg sm:border` 的等效寫法——**手機不套外框**（`flex-1 min-h-0` 保留，靠 `message-scroller` 內建 `scroll-fade-b` 呈現邊界），`sm:` 以上才有圓角外框。
- `MessageScrollerViewport` / `Content` / `Item`（含 `scrollAnchor`）與自動捲到底行為維持不變。
- 輸入列（`Textarea` ＋「送出」）維持為固定高度的 flex 子項，靠上一層 `min-h-0` 鏈保證恆在可視區、永不被裁切或被頁尾覆蓋。

### 2. `components/conversation/messages-page.tsx`：訊息頁籤面板改用動態視窗高 ＋ 手機去外框 ＋ 返回鍵進標題列

- **面板高度**：訊息頁籤內 `<div className="flex h-[calc(100vh-16rem)] min-h-[28rem] overflow-hidden rounded-lg border">` 改為以 `100dvh`（動態視窗高，涵蓋行動瀏覽器網址列）計算的彈性容器，例如 `flex h-[calc(100dvh-13rem)] min-h-[24rem] flex-col overflow-hidden sm:h-[calc(100vh-16rem)] sm:flex-row`，並在內層（左側頻道列表容器、右側窗格、`ConversationThread` 呼叫處）補上 `min-h-0`，形成完整的 `min-h-0` 鏈——確保對話串可壓縮、輸入框恆在面板內、不被 `Footer` 覆蓋。
- **手機去外框（`不要外框`）**：
  - 面板：`rounded-lg border` → `sm:rounded-lg sm:border`（手機無框）。
  - 左側頻道列表：`border-r` → `sm:border-r`。
  - 右側「對話資訊框」：`space-y-2 rounded-lg border p-3` → 手機改為無框（可保留 `border-b pb-3` 作分隔線），`sm:` 以上恢復 `rounded-lg border p-3`。
  - `MessageScroller` 外框於第 1 點處理。
- **返回鍵移到標題列右上角（`會上一頁 放在右上角 和 標題同一列`）**：
  - 移除現有 `mb-2 flex items-center gap-2 sm:hidden` 的**獨立返回列**。
  - **已選定對話**時：把返回鍵（`IconArrowLeft`，ghost、`sm:hidden`）放進「對話資訊框」的**標題列**（現為 `flex items-center gap-2` 內含標題 `flex-1 truncate` → 鉛筆 → 釘選），置於該列最右端 → 視覺上位於面板右上角、與標題同一列。點擊 `setMobileShowThread(false)` 回頻道列表。
  - **選擇既有對話（`isPicking`）／尚未選定**時：於該區塊頂端提供一列 `flex items-center justify-between sm:hidden`，左為狀態提示文字、右為同款返回鍵，維持「右上角返回」的一致性。
  - 返回鍵 `aria-label` / `title` 取用既有 i18n key `common.back`（「返回」），不新增文案、不寫死中文。

### 3. 文件與版本號

- `doc/學員手冊.md`：〈十五、社群〉「訊息頁籤」段——「手機上點對話後可用**左上角**箭頭返回列表」改為「**右上角**」；補一句「訊息頁籤已針對手機優化：對話串採 Message Scroller、輸入框不會被頁尾遮蔽、精簡外框」。檔首版本標註＋日期更新。
- `doc/老師手冊.md`／`doc/管理者操作手冊.md`：僅列出 Topbar 有「社群」按鈕，無「訊息頁籤操作細節」章節 → 不需內容變更；若檔首有版本標註則比照 rule 9 更新版本＋日期。
- `config/version.json`：patch 版本號 +1、`updatedAt` 改為套用當日（YYYY-MM-DD）。
- `ai-context/03-architecture.md`：於「社群 / 訊息頁」說明補「訊息頁籤行動裝置版面（`100dvh` 彈性高、Message Scroller、返回鍵於標題列、手機無外框）」；`ai-context/07-current-tasks.md`「已完成」清單最前面追加本 CR。`README-AI.md` 僅在版本號變動時更新版本行。

## Capabilities

### Modified Capabilities

- `contact-member`：新增一條需求，規範「訊息」頁籤在**行動裝置（窄螢幕）**下的版面——對話串以 Message Scroller 呈現且自動捲到最新、輸入框恆於可視區不被頁尾（`Footer`）遮蔽、精簡巢狀外框、返回頻道列表的操作位於對話標題列右端（右上角）。既有需求（Topbar 入口、頻道列表、發起／接續對話、釘選、群組、桌面文字可選取、窄螢幕切換）皆不變。

## Impact

- **Affected code**：
  - 修改：`components/conversation/conversation-thread.tsx`、`components/conversation/messages-page.tsx`、`doc/學員手冊.md`（視情況 `doc/老師手冊.md`／`doc/管理者操作手冊.md` 檔首版本）、`config/version.json`、`ai-context/03-architecture.md`／`ai-context/07-current-tasks.md`、`README-AI.md`（版本行）
  - 產生：`messages/zh-CN.json`（僅在有動到 `messages/*.json` 時；本 CR 預期**不新增文案**，故通常不需重產）
- **Database**：無。
- **Dependencies**：無新增。`@shadcn/react`（含 `message-scroller`）已是既有相依且已在 `ConversationThread` 使用。
- **Route access / 權限 / i18n 命名空間**：皆不變。返回鍵沿用既有 `common.back`。
- **範圍界線**：只影響 `/messages` 「訊息」頁籤在 `< sm`（手機）斷點的版面；`≥ sm`（桌面／平板）版面與所有對話互動邏輯零改動。

## Open Questions

- 無。三項需求（Message Scroller 不被 Footer 蓋住、手機不要外框、返回鍵置於標題列右上角）皆為明確的版面指示，實作細節（`100dvh` 計算式、`min-h-0` 鏈、`sm:` 斷點切換、返回鍵於 `isPicking`／未選定狀態的擺放）為工程決定。
