## Context

排查 vaul（`components/ui/drawer.tsx` 底層套件）原始碼確認根因：`node_modules/vaul/dist/index.js` 內建 CSS `@media (hover:hover) and (pointer:fine){[data-vaul-drawer]{user-select:none}}`——只在「有 hover＋精準指標」（桌面滑鼠）情境套用 `user-select:none`，觸控裝置不受影響。這是 vaul 為了讓滑動關閉手勢在滑鼠情境下不誤觸文字選取而刻意加上的行為，並非本專案程式碼的 bug，但直接導致訊息 Drawer 內的文字在桌面瀏覽器完全無法選取／複製。移除 Drawer、改用一般頁面即可完全繞開這條限制，是比「加複製按鈕」更根本的修復。

`components/conversation/message-drawer-provider.tsx`（Context + 全域狀態）與 `components/conversation/message-drawer.tsx`（UI）目前耦合在一起：Provider 管理對話列表／選中對話／loading／「傳訊息挑選既有對話或開新對話」等狀態，`MessageDrawer` 純粹是這些狀態的呈現層（包一層 `Drawer`/`DrawerContent`）。兩者的狀態邏輯與 UI 內容本身沒有問題，需要換掉的只有最外層的容器。

## Goals / Non-Goals

**Goals:**
- 訊息文字在桌面瀏覽器可用滑鼠正常選取、複製，觸控裝置行為不變。
- 沿用現有資料模型、Server Actions、`ConversationThread` 共用元件，僅替換呈現容器，將既有實作風險降到最低。
- 各既有入口（Topbar、學員專屬頁「傳訊息」、後台會員詳情頁「傳訊息」）改為導覽至新頁面，行為（挑選既有對話 vs 開新對話）與現行 Drawer 完全一致。

**Non-Goals:**
- 不恢復 `cr-spec-260803-004` 之前「管理者可共享檢視任何對話」的舊架構、不恢復 `/user/{spiritId}/messages`／`/admin/messages` 這種按對象或身分分開的多頁面設計——新頁面 SHALL 沿用目前「任何會員↔任何會員、統一 `/messages` 單一入口」的模型，只是把容器從 Drawer 換成頁面。
- 不將「目前選中的對話」寫入網址（不做 `?conversationId=` 深連結／瀏覽器上一頁回到特定對話），維持與現行 Drawer 相同的「選中狀態為前端 local state」行為；只有「透過 `?with=` 指定初次要對話的對象」這個既有行為需要保留（原本 Drawer 開啟時也是用參數，只是傳參方式從函式呼叫改成 URL query）。
- 不變更訊息／對話的資料模型、權限、通知、邀請、標題編輯、釘選等任何業務邏輯。

## Decisions

1. **單一 `/messages` 頁面，不做每個對話一個子路由**
   維持現行 Drawer 的資訊架構（左側頻道列表＋右側訊息記錄，同一畫面內切換），只是換容器；不新增 `/messages/{conversationId}` 之類的巢狀路由，避免不必要的路由複雜度與這次變更範圍外的深連結需求。

2. **`MessageDrawerProvider` 的狀態邏輯直接併入頁面的 Client Component，不再對外提供 Context**
   目前只有 `Topbar`（開啟）與 `SendMessageButton`（指定對象開啟）兩處消費 Context，兩者都只需要「導覽到某個網址」，不需要再讀取 Provider 內部狀態；改為一般頁面後，狀態只在 `/messages` 頁面自己的 Client Component 內有意義，不需要再往上提升到 Context 讓全站都能訂閱。

3. **Topbar 未讀角標改為 Server Component 直接算好傳入的 prop，不再靠 Context 即時反映**
   現行 Drawer 版本因為 Provider 常駐在 layout，使用者在同一個 session 內讀了某對話，Topbar 角標會立即消失（純前端 state 連動）。改為頁面導覽後，未讀數改由 `(user)/layout.tsx`／`(admin)/layout.tsx` 呼叫既有的 `getUnreadConversationCount(userId)` 算好傳入 `Topbar`，只在每次頁面請求時重新計算——這與 Topbar 另一個角標（`getUnreadNotificationCount` 算出的通知未讀數）本來就是同樣的「prop-based、隨頁面請求更新」模式一致，不是新增的不一致，可接受。

4. **移除 `vaul`／`components/ui/drawer.tsx`，不保留供未來其他功能使用**
   確認過專案內僅 `message-drawer.tsx` 一處引用 `components/ui/drawer.tsx`，且 `drawer.tsx` 僅為 `vaul` 的 shadcn 包裝、無其他自訂邏輯附加其上；比照專案「確定不用就整個刪除」慣例移除，未來若真的需要 Drawer UI 可再用 `npx shadcn add drawer` 重新加回。

## Risks / Trade-offs

- **[可接受] 開啟訊息從「原地滑出 Drawer」變成「頁面導覽」**：互動上會有一次頁面切換（不再是即時 Overlay），這是換成頁面必然的取捨，使用者已明確選擇以此方式徹底解決複製問題，優先於維持 Drawer 的即時開啟體感。
- **[可接受] Topbar 未讀角標不再於同一頁面內即時更新**：見 Decision 3，改為與通知角標一致的「隨頁面請求更新」模式，非本次新增的獨有限制。

## Migration Plan

1. `app/[locale]/(user)/messages/page.tsx`：新增 Server Component，`auth()` 取得 `userId`、`getMyConversations(userId)` 取得初始對話列表、讀取 `searchParams.with`，傳給新的 Client Component。
2. 新增 Client Component（`components/conversation/messages-page.tsx`）：整合原 `MessageDrawerProvider` 的狀態邏輯（頻道列表／選中對話／loading／挑選既有對話或開新對話）與原 `MessageDrawer` 的 UI（頻道列表＋訊息記錄雙欄佈局，窄螢幕單欄切換），移除 `Drawer`/`DrawerContent`/`DrawerClose` wrapper，改為一般 `<div>` 版面；掛載時若 `with` 有值，複製原 `openMessageDrawer(targetUserId)` 的邏輯（查詢既有對話、決定直接開新對話或顯示選擇畫面）。
3. `components/conversation/send-message-button.tsx`：移除 `useMessageDrawer`，改用 `useRouter`（`@/i18n/navigation`）導覽至 `` `/messages?with=${targetUserId}` ``。
4. `components/layout/topbar.tsx`：移除 `useMessageDrawer`，訊息按鈕改 `router.push('/messages')`；新增 `unreadMessageCount` prop（沿用既有 `unreadCount` prop 的傳遞模式）。
5. `app/[locale]/(user)/layout.tsx`／`app/[locale]/(admin)/layout.tsx`：移除 `MessageDrawerProvider`、`getMyConversations` 呼叫；改呼叫 `getUnreadConversationCount(userId)`，傳入 `Topbar` 的 `unreadMessageCount`。
6. 刪除 `components/conversation/message-drawer.tsx`、`components/conversation/message-drawer-provider.tsx`、`components/ui/drawer.tsx`；`npm uninstall vaul`。
7. i18n：`conversation.close`（原 Drawer 關閉按鈕文案）不再使用，移除該 key；`conversation.pageTitle`（"訊息"）沿用作為頁面 `<h1>`。
8. `npx tsc --noEmit` + `npm run lint`。

**Rollback：** 純前端呈現層變更，無 schema migration，revert commit 即可還原（`vaul` 需重新 `npm install` 若已移除）。
