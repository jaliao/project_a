## Why

原始需求（Justin）：寄出教材後會透過站內「訊息」私訊教師（通常含一段邀請加入群組的網址），教師端在手機瀏覽器可以直接長按選字複製訊息內容，但在桌面網頁版無法選取複製文字，導致教師得自己手動把網址重新輸入一次。

第一版方案（本 change 先前已實作、本次改版前已撤銷）是在每則訊息旁加一顆複製按鈕，繞過選取問題。後續與提出人討論後改採**根本原因修復**：本次重新排查發現，問題並非「選字比較難」的 UX 落差，而是目前訊息功能所在的容器——`components/conversation/message-drawer.tsx`（`vaul` Drawer）——在其 CSS 內明確寫死：

```css
@media (hover:hover) and (pointer:fine){[data-vaul-drawer]{user-select:none}}
```
（`node_modules/vaul/dist/index.js`，`[data-vaul-drawer]` 選擇器）

這條規則**只在「有 hover 能力＋精準指標（滑鼠）」的裝置生效**，也就是恰好對應「桌面瀏覽器」；觸控裝置（無 hover、無 fine pointer）不受影響。這精確解釋了「手機可以複製、桌面網頁版不行」的現象——vaul 為了讓拖曳手勢（滑動關閉 Drawer）在滑鼠情境下不會誤觸文字選取，主動對整個 Drawer 內容套用 `user-select:none`，訊息文字因此在桌面瀏覽器完全無法選取，複製按鈕只是繞過症狀，容器本身的限制仍在。

真正的修復是把訊息功能從「Drawer 彈窗」改回「獨立實體頁面」——頁面不受 vaul 的 `user-select:none` 限制，使用者可以用瀏覽器原生方式直接選取、複製任何訊息文字，且此舉同時讓好幾種相關情境「順帶」被解決（例如以滑鼠選取多則訊息、複製含格式的部分內容等），比複製按鈕的覆蓋範圍更完整。

## What Changes

- **移除訊息 Drawer，改為獨立頁面 `/messages`**：新增 `app/[locale]/(user)/messages/page.tsx`（Server Component，抓取初始對話列表），內容改用一個新的 Client Component（取代 `MessageDrawerProvider` + `MessageDrawer` 的職責，但不再包一層 `Drawer`/`DrawerContent`），版面沿用現有「左側頻道列表＋右側訊息記錄」雙欄佈局（窄螢幕下單欄切換），純粹以一般頁面渲染。
- **移除全域 Context 觸發機制**：`MessageDrawerProvider`（`components/conversation/message-drawer-provider.tsx`）整個移除；不再需要「任何頁面呼叫 `openMessageDrawer()` 開啟全域 Drawer」的機制，改用一般的頁面導覽（`router.push('/messages')` 或 `/messages?with={targetUserId}`）。
- **Topbar「訊息」圖示**：從「開啟 Drawer」改為「導覽至 `/messages`」，寫法比照 Topbar 既有其他圖示按鈕（`router.push`）；未讀角標邏輯不變，但資料來源從 Context 的 `unreadCount` 改為 Server Component 直接呼叫既有的 `getUnreadConversationCount(userId)` 並以 prop 傳入（`(user)/layout.tsx`、`(admin)/layout.tsx` 不再需要掛載 Provider、也不需要在 layout 層先抓整份對話列表）。
- **各頁面「傳訊息」入口**（`SendMessageButton`）：從呼叫 `openMessageDrawer(targetUserId)` 改為導覽至 `/messages?with={targetUserId}`；新頁面載入時 SHALL 讀取 `with` 查詢參數，複製原本 Drawer 的「若已有既有對話則顯示選擇畫面、否則直接進入新對話畫面」邏輯。
- **移除不再使用的相依套件與元件**：`components/conversation/message-drawer.tsx`、`components/ui/drawer.tsx`（僅被訊息 Drawer 使用，別處無引用）、`vaul`（package.json 依賴，`npx shadcn` 當初為此新增，其他元件未使用其 API）。
- **`ConversationThread` 共用元件不變**：頻道內訊息記錄／輸入框的呈現與送出邏輯完全沿用，只是渲染容器從 Drawer 換成頁面區塊，`app/actions/conversation.ts`、`lib/data/conversation.ts` 既有的 Server Actions／查詢函式全數保留、不改介面。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `contact-member`：訊息呈現方式由「全域 Drawer 彈窗」改為「獨立頁面 `/messages`」，移除 Drawer 特有的「滿版顯示與明確關閉按鈕」需求，新增頁面呈現與 `?with=` 深連結相關需求；其餘對話資料模型、發起/回覆權限、通知、邀請、釘選、標題編輯等既有行為不變。

## Impact

- **新增**：`app/[locale]/(user)/messages/page.tsx`；新的 Client Component（暫定 `components/conversation/messages-page.tsx`，整合原 `MessageDrawerProvider` 狀態邏輯與 `MessageDrawer` 的頻道列表／訊息記錄 UI，移除 Drawer 相關 wrapper）。
- **修改**：`components/layout/topbar.tsx`（訊息按鈕改 `router.push('/messages')`，`unreadMessageCount` 改吃 prop）、`app/[locale]/(user)/layout.tsx`／`app/[locale]/(admin)/layout.tsx`（移除 `MessageDrawerProvider` 掛載與 `getMyConversations` 呼叫，改呼叫 `getUnreadConversationCount` 並傳入 `Topbar`）、`components/conversation/send-message-button.tsx`（改用 `router.push` 導覽，不再依賴 Context）。
- **移除**：`components/conversation/message-drawer.tsx`、`components/conversation/message-drawer-provider.tsx`、`components/ui/drawer.tsx`；`package.json` 移除 `vaul` 依賴（執行 `npm uninstall vaul`）。
- **不修改**：資料模型（`Conversation`／`ConversationParticipant`／`ConversationMessage`）、`app/actions/conversation.ts` 所有 Server Actions 的簽章與行為、`lib/data/conversation.ts` 的查詢函式、對話發起/回覆/邀請/釘選/標題編輯/通知等既有業務邏輯——本次變更純粹是「呈現容器」從 Drawer 換成頁面，資料流與權限邏輯完全不變。
- **取代前一版方案**：本 change 先前已實作「訊息旁複製按鈕」（`ConversationThread` 新增 `copyLabel`/`copiedLabel` props 等），該版本程式碼已於本次改版前撤銷（`git checkout` 還原），不併入本次變更。
