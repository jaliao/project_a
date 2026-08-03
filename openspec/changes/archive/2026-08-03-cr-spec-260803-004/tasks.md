## 1. UI 元件安裝

- [x] 1.1 執行 `npx shadcn@latest add drawer`，確認 `components/ui/drawer.tsx` 產生，`package.json` 新增 `vaul` 依賴

## 2. 資料模型

- [x] 2.1 `prisma/schema/conversation.prisma`：`ConversationParticipant` 新增 `lastReadAt DateTime?`
- [x] 2.2 執行 `make schema-update name=add_conversation_last_read_at`（純新增欄位，無破壞性變更）

## 3. Data Layer 重寫（lib/data/conversation.ts）

- [x] 3.1 新增 `getMyConversations(userId)`：回傳使用者參與的所有對話，依 `lastMessageAt` 倒序，每筆含對方顯示名稱／頭像 URL（`resolveAvatarUrl`）／最新訊息預覽／`isUnread`（`lastMessageAt > (participant.lastReadAt ?? conversation.createdAt)`）
- [x] 3.2 新增 `getConversationMessages(conversationId)`（實作簽名為 `getConversationMessages(conversationId, viewerId)`，多帶一個 `viewerId` 才能算出「對方」是誰）：回傳該對話完整訊息記錄（沿用既有 `messageSelect`／`mapMessages` 邏輯）
- [x] 3.3 新增 `getUnreadConversationCount(userId)`：計算目前使用者有幾個對話處於未讀狀態
- [x] 3.4 移除 `getMyConversation`（單數）、`getConversationList`、`getConversationDetail`、`getMemberConversationSummary`

## 4. Server Actions 重寫（app/actions/conversation.ts）

- [x] 4.1 `startConversation(targetUserId, body)`：改為任何登入使用者可呼叫；驗證 `targetUserId !== session.user.id`、`targetUserId` 對應使用者存在；查詢雙方是否已有共同 `Conversation`（`participants.some` AND 條件），有則呼叫傳訊邏輯，否則 `$transaction` 建立 `Conversation`＋兩筆 `ConversationParticipant`＋首則 `ConversationMessage`；通知對方
- [x] 4.2 `sendConversationMessage(conversationId, body)`：授權簡化為「僅該對話參與者」（移除 `canAccessAdmin` 特例）；建立訊息後通知該對話中除寄件者外的所有其他參與者（移除依角色分組的通知邏輯）
- [x] 4.3 新增 `markConversationRead(conversationId)`：登入檢查、確認為參與者、更新該筆 `ConversationParticipant.lastReadAt`
- [x] 4.4 新增 `fetchMyConversations()`：包裝 `getMyConversations(session.user.id)`，供 Client Component（Drawer）呼叫
- [x] 4.5 新增 `fetchConversationMessages(conversationId)`：驗證呼叫者為該對話參與者、包裝 `getConversationMessages`，並在同一次呼叫內呼叫 `markConversationRead`（開啟即已讀）
- [x] 4.6 移除舊有 `notifyAndRevalidate` 依「管理者／會員」分組通知的邏輯，改為單純「通知除寄件者外的所有參與者」；`revalidatePath` 呼叫一併檢視是否仍需要（Drawer 資料流不依賴頁面 revalidate，僅 Topbar 未讀角標可能需要）

## 5. 全域 Drawer 觸發機制

- [x] 5.1 新增 `components/conversation/message-drawer-provider.tsx`（另補一個 `fetchOrPreviewConversation` action 供「傳訊息」入口在尚未建立對話時預覽對方資訊）：`'use client'` Context Provider，提供 `openMessageDrawer(targetUserId?: string)`；內部管理 Drawer 開關狀態、目前選中的 `conversationId`、頻道列表 state（初始值取自 props `initialConversations`）
- [x] 5.2 `app/[locale]/(user)/layout.tsx`：呼叫 `getMyConversations`／`getUnreadConversationCount`，包一層 `<MessageDrawerProvider initialConversations={...} unreadCount={...}>`
- [x] 5.3 `app/[locale]/(admin)/layout.tsx`：比照 5.2 掛載 Provider

## 6. Drawer UI

- [x] 6.1 新增 `components/conversation/message-drawer.tsx`：`Drawer`／`DrawerContent`（`direction="right"`）內分頻道列表（可捲動，每筆 `UserAvatar`＋顯示名稱＋最新訊息預覽＋未讀樣式，點擊切換）與選中頻道的訊息記錄（沿用 `ConversationThread`）＋輸入框；未選中頻道時顯示空狀態；窄螢幕下選中頻道時隱藏列表、顯示返回按鈕
- [x] 6.2 `components/conversation/conversation-thread.tsx`：移除「固定單一 conversationId」的隱含假設（確保可隨 Drawer 切換頻道時正確依 `key`／props 變化重新渲染訊息記錄）

## 7. 各入口整合

- [x] 7.1 `components/layout/topbar.tsx`：「訊息」按鈕改為呼叫 `openMessageDrawer()`（不再 `router.push`）；新增未讀角標（`unreadMessageCount` prop，樣式比照既有 Notification `unreadCount` 角標）
- [x] 7.2 `app/[locale]/(user)/user/[spiritId]/page.tsx`：基本資料區塊新增「傳訊息」按鈕，`!isOwnPage` 時顯示，呼叫 `openMessageDrawer(user.id)`
- [x] 7.3 `app/[locale]/(admin)/admin/members/[id]/page.tsx`：移除「站內訊息」`TabsTrigger`／`TabsContent`，於頁首操作區新增「傳訊息」按鈕，呼叫 `openMessageDrawer(member.id)`

## 8. 移除舊頁面/元件

- [x] 8.1 刪除 `app/[locale]/(user)/user/[spiritId]/messages/`（整個資料夾）
- [x] 8.2 刪除 `app/[locale]/(admin)/admin/messages/`（整個資料夾，含 `[id]` 子路由）
- [x] 8.3 刪除 `components/admin/member-start-conversation-form.tsx`
- [x] 8.4 `app/[locale]/(admin)/admin/page.tsx`：`ADMIN_FEATURES` 移除「站內訊息」項目

## 9. i18n

- [x] 9.1 `messages/zh-TW.json`：`nav.messages` 由「站內訊息」改為「訊息」；`conversation` 命名空間新增 Drawer 相關文案（頻道列表標題、空狀態、未讀樣式提示文字、「傳訊息」按鈕文字等）
- [x] 9.2 `messages/en.json` 補上對應英文翻譯（`nav.messages` 維持 "Messages" 不變）
- [x] 9.3 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 10. 驗證

- [x] 10.1 `npx tsc --noEmit`、`npm run lint` 通過
- [ ] 10.2 會員 A 於自己的學員專屬頁面看不到「傳訊息」按鈕；造訪會員 B 的頁面看得到，點擊後開啟 Drawer 並可直接輸入送出，確認建立新對話、B 收到 Inbox 通知
- [ ] 10.3 會員 A 再次對會員 B 送出訊息，確認併入既有對話（未建立第二條）
- [ ] 10.4 以會員 B 身分登入，Topbar「訊息」圖示顯示未讀角標；點擊開啟 Drawer，確認看到與 A 的對話、未讀樣式；點入後角標消失
- [ ] 10.5 會員 C（未參與 A、B 對話）確認在自己的 Drawer 看不到 A、B 的對話；管理者帳號同樣確認看不到非本人參與的對話（驗證管理者特權已移除）
- [ ] 10.6 管理者於某會員的後台詳情頁點擊「傳訊息」，確認開啟 Drawer 並可對該會員發起/接續對話
- [ ] 10.7 確認 `/user/{spiritId}/messages`、`/admin/messages`、`/admin/messages/{id}` 皆已移除（404 或路由不存在）；後台首頁不再顯示「站內訊息」功能卡；會員詳情頁不再有「站內訊息」分頁
- [ ] 10.8 確認訊息內容驗證（空白、超過 2000 字）與無法對自己發起對話的錯誤情境

**已知阻塞（本次 session 無法完成）**：10.2–10.8 需要在瀏覽器中實際登入操作驗證。本次 session 嘗試啟動自己的 `next dev --turbopack`（含換一個未被占用的 port 3001）皆失敗於同一個原因：`Unable to acquire lock at /home/psyduck/projects/project_a/.next/dev/lock, is another instance of next dev running?`——`.next/dev/lock` 是綁定專案目錄本身、不隨 port 而變，換 port 仍卡住，判斷這台機器上目前有一個不屬於本次 session 的既有 `next dev` 行程正在佔用（很可能是使用者自己在其他終端機執行的 `make dev`），本次未嘗試終止或介入該行程。程式碼變更（1.1–10.1，含 UI 元件安裝、Prisma migration、Data Layer／Server Actions 全面重寫、全域 Drawer 觸發機制、六處入口整合、舊頁面/元件移除、i18n）皆已完成並通過 `tsc`／`lint`；10.2–10.8 待使用者於自己的開發環境手動驗證。
