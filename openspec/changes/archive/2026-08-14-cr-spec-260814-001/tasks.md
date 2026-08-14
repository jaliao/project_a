## 1. 新增訊息頁面

- [x] 1.1 新增 `app/[locale]/(user)/messages/page.tsx`（Server Component）：`auth()` 取得 `userId`（未登入導向 `/login`，比照 `notifications/page.tsx` 寫法）、呼叫 `getMyConversations(userId)` 取得初始對話列表、讀取 `searchParams.with`，將這些資料傳給新的 Client Component
- [x] 1.2 新增 `components/conversation/messages-page.tsx`（`'use client'`）：整合原 `MessageDrawerProvider` 的狀態邏輯（頻道列表 state、選中對話、loading、挑選既有對話或開新對話的 picking state）與原 `MessageDrawer` 的 UI（頻道列表＋訊息記錄雙欄佈局，`sm:` 斷點雙欄、窄螢幕單欄切換＋返回按鈕），改為一般 `<div>` 版面（不包 `Drawer`/`DrawerContent`），頁面標題用 `<h1>{t('pageTitle')}</h1>`
- [x] 1.3 `messages-page.tsx` 掛載時若 `with` prop 有值：複製原 `openMessageDrawer(targetUserId)` 邏輯——呼叫 `fetchConversationsWithUser(targetUserId)`，無既有對話則呼叫 `fetchPreviewNewConversation` 直接進入新對話畫面，有既有對話則進入選擇畫面（沿用既有 `pickingCandidates`／`isPicking` 邏輯）
- [x] 1.4 沿用既有 Server Actions（`app/actions/conversation.ts`）：`sendConversationMessage`／`startConversation`／`markConversationRead`（透過 `fetchConversationMessages` 內建呼叫）／`updateConversationTitle`／`inviteToConversation`／`togglePinConversation`，簽章與行為皆不變

## 2. 各入口改為導覽至新頁面

- [x] 2.1 `components/layout/topbar.tsx`：移除 `useMessageDrawer` import 與用法，訊息按鈕 `onClick` 改為 `router.push('/messages')`（比照既有其他圖示按鈕寫法）；新增 `unreadMessageCount` prop（型別與預設值比照既有 `unreadCount` prop），角標渲染邏輯不變
- [x] 2.2 `components/conversation/send-message-button.tsx`：移除 `useMessageDrawer`，改用 `useRouter`（`next/navigation`——比照本檔與 `topbar.tsx`／`course-detail-actions.tsx` 等既有慣例，非 `@/i18n/navigation`），`onClick` 改為 `router.push('/messages?with='+targetUserId)`
- [x] 2.3 `app/[locale]/(user)/layout.tsx`：移除 `MessageDrawerProvider`、`getMyConversations` 的 import 與呼叫；改呼叫 `getUnreadConversationCount(userId)`，將結果傳給 `<Topbar unreadMessageCount={...} />`
- [x] 2.4 `app/[locale]/(admin)/layout.tsx`：比照 2.3 移除 Provider、改用 `getUnreadConversationCount`
- [x] 2.5（範圍外追加）`components/admin/member-tag.tsx`：實作時發現這個既有（未 commit、屬另一張 CR `cr-spec-260804-001`/`260804-005`）元件也呼叫 `useMessageDrawer(id)`，刪除 Provider 會導致其編譯失敗；一併改為 `useRouter` + `router.push('/messages?with='+id)`，未變動其餘版面/邏輯

## 3. 移除不再使用的元件與依賴

- [x] 3.1 刪除 `components/conversation/message-drawer.tsx`
- [x] 3.2 刪除 `components/conversation/message-drawer-provider.tsx`
- [x] 3.3 刪除 `components/ui/drawer.tsx`（確認刪除前已無其他檔案引用）
- [x] 3.4 執行 `npm uninstall vaul`，確認 `package.json`／`package-lock.json` 已移除該依賴

## 4. i18n

- [x] 4.1 `messages/zh-TW.json`（`conversation` 命名空間）：移除不再使用的 `close` key（原 Drawer 關閉按鈕文案）；確認 `pageTitle`／`emptyState`／`selectChannelHint`／`pickerHint`／`startNewConversation` 等既有 key 沿用無需改動
- [x] 4.2 `messages/en.json`：比照移除 `close` key
- [x] 4.3 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit`、`npm run lint` 通過（0 errors；既有 16 個 warnings 與本次變更無關）
- [x] 5.1b Smoke test：對已在跑的本機 dev server（`http://localhost:3000`，非本次 session 啟動，判斷為使用者自己的 `make dev`）以 `curl` 檢查 `/messages`、`/notifications`、`/`、`/login`，皆正常回應（`/messages` 未登入時 307 導向 `/login`，與既有受保護頁面行為一致，無 500，確認頁面／元件可正常編譯執行）
- [x] 5.2 桌面瀏覽器（Chrome）點擊 Topbar「訊息」，確認導覽至 `/messages` 頁面（非 Drawer 滑出），可看到頻道列表；點入任一對話後，以滑鼠拖曳選取訊息文字，確認可正常選取並複製、貼上內容一致
- [x] 5.3 從學員專屬頁面／後台會員詳情頁點擊「傳訊息」，確認導覽至 `/messages?with={targetUserId}`，尚無對話時直接進入新對話畫面、已有對話時顯示選擇畫面，行為與原 Drawer 一致
- [x] 5.4 窄螢幕（或瀏覽器手機模擬）確認頻道列表與訊息記錄可切換、返回按鈕正常運作
- [x] 5.5 確認 Topbar 未讀角標於有未讀對話時正常顯示、進入該對話已讀後角標消失（下次頁面請求生效，非同頁即時更新）
- [x] 5.6 確認 `/user/{spiritId}/messages`、`/admin/messages` 等舊路由（`cr-spec-260803-004` 已移除）未被本次變更誤建立

5.2–5.6 已由使用者於自己的登入環境完成手動瀏覽器驗證（含 5.2 核心驗收項目「桌面滑鼠選取複製文字」），全部 23 項任務皆已完成。
