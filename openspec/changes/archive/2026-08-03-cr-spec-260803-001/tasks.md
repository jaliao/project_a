## 1. UI 元件安裝

- [x] 1.1 執行 `npx shadcn@latest add message message-scroller`，確認 `components/ui/message.tsx`、`components/ui/message-scroller.tsx` 產生，`package.json` 新增 `@shadcn/react` 依賴

## 2. 資料模型

- [x] 2.1 新增 `prisma/schema/conversation.prisma`：`Conversation`／`ConversationParticipant`（`@@unique([conversationId, userId])`）／`ConversationMessage` 三個 model（欄位詳見 design.md）
- [x] 2.2 `prisma/schema/user.prisma`：`User` model 補上反向關聯 `conversationsCreated`、`conversationParticipations`、`conversationMessages`
- [x] 2.3 執行 `make schema-update name=add_conversation`（純新增資料表，無破壞性變更）

## 3. Zod Schema 與 i18n

- [x] 3.1 新增 `lib/schemas/conversation.ts`：`conversationMessageSchema`（`body`：trim 後 1–2000 字，訊息走 `validation.conversationMessageRequired`／`validation.conversationMessageMax2000` i18n key）
- [x] 3.2 `messages/zh-TW.json`：新增 `validation.conversationMessageRequired`（"請輸入訊息內容"）、`validation.conversationMessageMax2000`（"訊息最長 2000 字"）；新增 `nav.messages`（"站內訊息"）；新增 `conversation` 命名空間（`pageTitle`、`emptyState`、`placeholder`、`send`、`sendSuccess` 等頁面文案）
- [x] 3.3 `messages/en.json`：補上對應英文翻譯（`validation.*`、`nav.messages`、`conversation.*`）
- [x] 3.4 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 4. Data Layer

- [x] 4.1 新增 `lib/data/conversation.ts`：`getMyConversation(userId)`（供會員頁，經 `ConversationParticipant.findFirst({ where: { userId } })` 取得本人對話與訊息）、`getConversationList()`（供管理者列表頁，依 `lastMessageAt` 倒序，含目標會員顯示名稱與最新訊息預覽）、`getConversationDetail(conversationId)`（供對話串頁，含完整訊息與參與者）、`getMemberConversationSummary(memberId)`（供會員詳情頁分頁，回傳該會員對話 id 或 null）

## 5. Server Actions

- [x] 5.1 新增 `app/actions/conversation.ts`：`startConversation(memberId, body)`——`canAccessAdmin` 檢查、Zod 驗證、查詢該會員既有對話（`ConversationParticipant.findFirst`），若已存在則等同呼叫傳訊邏輯，否則於 `$transaction` 內建立 `Conversation`＋兩筆 `ConversationParticipant`＋首則 `ConversationMessage`，完成後通知該會員
- [x] 5.2 `sendConversationMessage(conversationId, body)`——授權為 `canAccessAdmin` 或目前使用者已是該對話參與者；Zod 驗證；建立 `ConversationMessage`；若寄件者為尚未加入的管理者則補建立 `ConversationParticipant`；更新 `Conversation.lastMessageAt`；查出目前所有參與者依角色分組後，寄件者為管理者→通知會員參與者，寄件者為會員→通知所有管理者參與者（排除寄件者）
- [x] 5.3 兩個 action 皆於成功後 `revalidatePath` 對應頁面（會員頁 `/user/{spiritId}/messages`、管理者對話串頁 `/admin/messages/{id}`、管理者列表頁 `/admin/messages`）

## 6. 共用對話串元件

- [x] 6.1 新增 `components/conversation/conversation-thread.tsx`（`'use client'`）：以 `MessageScrollerProvider`／`MessageScroller`／`MessageScrollerViewport`／`MessageScrollerContent`／`MessageScrollerItem`／`MessageScrollerButton` 包裹訊息列表；每則訊息用 `Message`／`MessageAvatar`（預設 `IconUser` 圖示佔位）／`MessageContent`／`MessageHeader`，`align` 依 `message.authorId === currentUserId` 決定；底部固定 `Textarea` + 送出 `Button`，呼叫傳入的 `onSend` callback，送出成功後清空輸入框並 `router.refresh()`

## 7. 會員端頁面

- [x] 7.1 新增 `app/[locale]/(user)/user/[spiritId]/messages/page.tsx`：驗證 `spiritId` 為本人（否則導向/404，比照既有本人頁面限制）；呼叫 `getMyConversation` 取得對話；有對話則渲染 `ConversationThread`（`onSend` 綁定 `sendConversationMessage`），無對話則顯示空狀態（`conversation.emptyState`），皆使用 i18n key
- [x] 7.2 `components/layout/topbar.tsx`：新增「站內訊息」圖示按鈕（`t('nav.messages')`），導向 `/user/{spiritId}/messages`

## 8. 管理者端頁面

- [x] 8.1 `app/[locale]/(admin)/admin/page.tsx`：`ADMIN_FEATURES` 新增「站內訊息」功能卡，導向 `/admin/messages`
- [x] 8.2 新增 `app/[locale]/(admin)/admin/messages/page.tsx`：呼叫 `getConversationList`，列表顯示會員顯示名稱／最新訊息預覽／最新訊息時間，依 `lastMessageAt` 倒序，空狀態提示；點擊導向 `/admin/messages/{id}`
- [x] 8.3 新增 `app/[locale]/(admin)/admin/messages/[id]/page.tsx`：呼叫 `getConversationDetail`，渲染 `ConversationThread`（`onSend` 綁定 `sendConversationMessage`）
- [x] 8.4 `app/[locale]/(admin)/admin/members/[id]/page.tsx`：`Tabs` 新增「站內訊息」分頁；呼叫 `getMemberConversationSummary` 判斷該會員是否已有對話——無則顯示發送新訊息表單（送出呼叫 `startConversation`，成功後導向 `/admin/messages/{新對話 id}`）；有則顯示「查看完整對話」連結導向 `/admin/messages/{id}`

## 9. 驗證

- [x] 9.1 `npx tsc --noEmit`、`npm run lint` 通過
- [ ] 9.2 管理者於某會員（學員身分）詳情頁「站內訊息」分頁送出首則訊息，確認導向新對話串頁、內容正確顯示；該會員收到 Inbox 通知
- [ ] 9.3 以該會員身分登入，確認 Topbar「站內訊息」可見對話並可回覆；回覆後確認發起的管理者收到 Inbox 通知
- [ ] 9.4 管理者於某講師身分的會員重複驗證 9.2－9.3（確認學員與講師皆適用）
- [ ] 9.5 另一位管理者（非發起人）開啟 `/admin/messages`，確認可看到該對話並成功回覆；回覆後確認該對話目前所有管理者參與者（含最初發起者與此次回覆者）皆收到 Inbox 通知
- [ ] 9.6 確認會員本人的 `/user/{spiritId}/messages` 在尚未被任何管理者聯繫時顯示空狀態、無法自行發起對話（無輸入框）
- [ ] 9.7 確認其他會員無法看到不屬於自己的對話內容（存取他人 `/user/{spiritId}/messages` 不顯示他人對話）
- [ ] 9.8 確認訊息內容驗證：空白內容與超過 2000 字皆被拒絕並顯示對應提示（會員端與管理者端皆測）

**已知阻塞（本次 session 無法完成）**：9.2–9.8 需要在瀏覽器中實際登入操作驗證。本次 session 中：①自行啟動 `next dev --turbopack` 仍與 `cr-spec-260803-002` 那次相同，直接 panic（`TurbopackInternalError: Permission denied (os error 13)`）；②port 3000 意外已有一個非本次 session 啟動的既有服務在監聽（`ps aux` 看不到該行程，來源不明），對其發出的請求 `/admin/messages` 回傳 500／`next-error: not-found`，判斷該服務跑的並非本次新增的程式碼（該路由在其build中不存在），因此不適合當作驗證對象，也未嘗試關閉或介入該不明行程。程式碼變更（1.1–9.1，含 UI 元件安裝、Prisma migration、Server Actions、Data Layer、共用元件、會員端與管理者端頁面）皆已完成並通過 `tsc`／`lint`；9.2–9.8 待使用者於自己的開發環境（`make dev`）手動驗證。
