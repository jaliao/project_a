## Context

`cr-spec-260803-001`（尚未封存，仍在 `openspec/changes/cr-spec-260803-001/`）建立了 `Conversation`／`ConversationParticipant`／`ConversationMessage` 資料模型，`ConversationParticipant` 從一開始就採多對多中介表設計，明確是為了「未來群組聊天／多筆對話」預留彈性（見該 CR design.md 的 Non-Goals 與 Risks）。本次正是這個「未來」提前到來，但仍限定 1:1（不做多人群聊），只是「一人可同時參與多個獨立的 1:1 對話」。

上一版的核心假設本次全部翻新：
- 「每個 Conversation 恰有一位非管理者參與者」→ 拿掉，任何兩位使用者都可以有一個 Conversation。
- 「僅管理者可發起」→ 拿掉，任何登入使用者皆可對任何其他使用者發起。
- 「任一管理者共享可見任何對話」→ 拿掉，改為僅該對話的參與者可見（已與提出人確認）。
- 「獨立頁面呈現」→ 拿掉，改為全域 Drawer（已與提出人確認）。

因為 `cr-spec-260803-001` 尚未封存進主規格（`openspec/specs/` 目前還沒有 `contact-member`／`admin-conversation-management`），本次 delta spec 直接對這兩個 capability 名稱寫 `MODIFIED`／`REMOVED`，語意上是「基於 001 已完成的成果做修改」；封存時依序（001 先、004 後）疊加即可得到正確的最終版本。

## Goals / Non-Goals

**Goals:**
- 任何登入會員可對任何其他會員發起或接續一段 1:1 對話。
- 一人可同時擁有多筆各自獨立的對話（不同對象），同一對象間仍只有一條持續對話。
- 全域 Drawer：頻道列表＋選中頻道訊息記錄＋回覆輸入框，任何頁面皆可開啟，不需要導覽到專屬路由。
- 未讀提示：Drawer 頻道列表標示未讀、Topbar 圖示疊加未讀角標。

**Non-Goals（本次明確不做）：**
- 不做多人群聊（仍是 1:1；`ConversationParticipant` 多對多設計已具備未來擴充彈性，但本次每個 Conversation 仍恰有 2 位參與者）。
- 不做訊息刪除／編輯、不做訊息分頁／lazy load（沿用 001 既有的簡化決策，本次規模不足以需要這些）。
- 不做即時推播（無 WebSocket／SSE）；Drawer 內容靠 Server Action 呼叫更新，非自動輪詢。
- 不擴充到 `SupportInquiry`／`CourseMessage`，三套機制持續並存。
- 不做「已讀回條」（對方是否已讀我的訊息），僅做「我是否有未讀」這一種單向已讀狀態。
- 不做封鎖／檢舉／黑名單機制。

## Decisions

### 資料模型異動（唯一的 schema 變更）

```prisma
// prisma/schema/conversation.prisma（ConversationParticipant 新增欄位）
lastReadAt DateTime? // 該使用者最後一次查看此對話的時間；null = 從未查看
```

`Conversation`／`ConversationMessage` 結構完全不變。`Conversation.createdById` 欄位語意由「發起的管理者」變成「發起人」（任何使用者），欄位本身不變，僅程式碼註解更新。

### 找對話／發起訊息邏輯

`startConversation(targetUserId: string, body: string)`（任何登入使用者可呼叫）：
1. 登入檢查；`targetUserId === session.user.id` 時拒絕（不能自己傳給自己）。
2. 驗證 `targetUserId` 對應使用者存在。
3. 訊息內容驗證（沿用 `conversationMessageSchema`）。
4. 找出雙方是否已有共同對話：
   ```ts
   const existing = await prisma.conversation.findFirst({
     where: {
       AND: [
         { participants: { some: { userId: session.user.id } } },
         { participants: { some: { userId: targetUserId } } },
       ],
     },
   })
   ```
   本次僅 1:1，此查詢在「每個 Conversation 恰 2 位參與者」的前提下能正確定位到雙方的唯一對話；若未來做群聊，需要重新設計此查詢（不能再用「兩人都在」判斷，因為群組也會符合）。
5. 若已存在，等同呼叫 `sendConversationMessage`；否則於 `$transaction` 建立 `Conversation` + 兩筆 `ConversationParticipant` + 首則 `ConversationMessage`。
6. 通知對方。

### 傳訊息與已讀

`sendConversationMessage(conversationId, body)`：授權簡化為「目前使用者是該對話的 `ConversationParticipant`」（拿掉 `canAccessAdmin` 特例）；建立訊息後通知該對話中除寄件者外的所有其他參與者（1:1 情境下就是對方一人；為未來群聊預留擴充彈性，邏輯本身已是「通知除自己外的所有參與者」，不需要再改）。

`markConversationRead(conversationId)`（新）：登入檢查、確認為該對話參與者、`prisma.conversationParticipant.update({ where: { conversationId_userId: {...} }, data: { lastReadAt: new Date() } })`。未讀判定：`conversation.lastMessageAt > (participant.lastReadAt ?? epoch)`。

### Drawer 資料流（Server Component 初始資料 + Server Action 動態讀取）

Drawer 是 Client Component，無法直接 `await prisma...`，採兩層資料流：
1. **初始資料**：`(user)/layout.tsx`／`(admin)/layout.tsx`（Server Component）呼叫 `getMyConversations(session.user.id)`（`lib/data/conversation.ts`）取得頻道列表，連同 `getUnreadConversationCount` 一併傳給 `<MessageDrawerProvider initialConversations={...} unreadCount={...}>`；Topbar 的未讀角標直接吃這個初始值（比照現有 Notification `unreadCount` 的既有模式）。
2. **動態讀取**：新增 `app/actions/conversation.ts` 內的讀取用 Server Actions（`'use server'` 函式亦可作為 Client Component 的資料讀取管道，非僅限 mutation）：
   - `fetchMyConversations()`：Drawer 開啟時重新整理頻道列表（避免用 layout 傳入的初始值過舊）。
   - `fetchConversationMessages(conversationId)`：切換到某頻道時載入完整訊息記錄，同一次呼叫內一併呼叫 `markConversationRead`（「開啟即已讀」，比照多數即時通訊 App 慣例）。
   送出訊息（`sendConversationMessage`）成功後，前端重新呼叫 `fetchConversationMessages`／`fetchMyConversations` 更新本地 state，不依賴 `router.refresh()`（Drawer 疊加在當前頁面之上，其內容不是來自目前頁面的 Server Component render）。

### Context Provider 與觸發機制

新增 `components/conversation/message-drawer-provider.tsx`：
```tsx
'use client'
type MessageDrawerContextValue = {
  openMessageDrawer: (targetUserId?: string) => void
}
```
- Provider 掛在 `app/[locale]/(user)/layout.tsx` 與 `app/[locale]/(admin)/layout.tsx`（兩個平行 route group，各自掛一份；不掛在更上層的 `app/[locale]/layout.tsx`，因為 guest 頁面不需要訊息功能）。
- `openMessageDrawer(targetUserId)`：開啟 Drawer；若帶 `targetUserId`，內部呼叫 `startConversation`／或先查是否已有對話再決定顯示哪個頻道（實作簡化：一律呼叫「取得或建立與該對象的對話」的邏輯，取得 `conversationId` 後直接選中該頻道並載入訊息）。
- Topbar「訊息」按鈕呼叫 `openMessageDrawer()`（不帶對象，預設開啟顯示頻道列表，選中列表第一筆或維持未選中狀態）。
- 首頁「傳訊息」按鈕、會員詳情頁「傳訊息」按鈕呼叫 `openMessageDrawer(targetUserId)`。

### Drawer UI 結構

新增 `components/conversation/message-drawer.tsx`，使用 `direction="right"`（`components/ui/drawer.tsx`，`npx shadcn@latest add drawer` 安裝，依賴 `vaul`）：
- `DrawerContent`（`w-3/4 sm:max-w-sm`，右側滑出）內分兩區：
  - 上方：頻道列表（可捲動），每筆顯示對方 `UserAvatar`／顯示名稱／最新訊息預覽／未讀樣式（例如粗體或圓點），點擊切換選中頻道。
  - 下方：選中頻道時顯示 `ConversationThread`（沿用 001 的元件，拿掉「固定單一 conversationId」假設，改為依 Drawer 內部 state 切換 key 重新渲染）＋輸入框；未選中任何頻道時顯示空狀態提示。
- 手機窄螢幕：頻道列表與訊息記錄可能需要在小螢幕下切頁顯示而非並排（沿用 `Drawer` 本身 `w-3/4` 寬度限制，內部用簡單的「選中頻道時隱藏列表、顯示返回按鈕切回列表」處理，不做複雜的 responsive breakpoint 設計）。

### 未讀角標

`lib/data/conversation.ts` 新增 `getUnreadConversationCount(userId)`：計算「有多少個對話目前 `lastMessageAt > (該使用者的 lastReadAt ?? 對話建立時間)`」，回傳數字。Topbar 比照既有 `unreadCount`（Notification 用）的角標樣式，新增 `unreadMessageCount` prop 顯示在「訊息」圖示右上角。

### 移除清單

- 頁面／資料夾：`app/[locale]/(user)/user/[spiritId]/messages/`、`app/[locale]/(admin)/admin/messages/`（含 `[id]` 子路由）。
- 元件：`components/admin/member-start-conversation-form.tsx`（改用會員詳情頁的「傳訊息」按鈕觸發 Drawer 取代）。
- `app/[locale]/(admin)/admin/page.tsx`：`ADMIN_FEATURES` 移除「站內訊息」項目。
- `app/[locale]/(admin)/admin/members/[id]/page.tsx`：`Tabs` 移除「站內訊息」`TabsTrigger`／`TabsContent`，改為頁首「傳訊息」按鈕。
- `lib/data/conversation.ts`：移除 `getMyConversation`（單數）、`getConversationList`、`getConversationDetail`、`getMemberConversationSummary`。

### 文案語言策略調整

`MessageDrawer`／`MessageDrawerProvider` 是前後台共用元件（管理者現在僅是「一般使用者」身份使用同一套訊息功能，不再有身份分支），因此**統一走 i18n**（沿用 001 已建立的 `conversation` 命名空間，擴充新的 key：頻道列表標題、空狀態、「傳訊息」按鈕文字等），不再依「前台 i18n／後台硬編碼」分流——這與 001 的策略不同，因為 001 的後台頁面（`/admin/messages` 等）是後台專屬路由，本次的 Drawer 是不分前後台的共用元件。後台會員詳情頁的「傳訊息」按鈕本身（觸發用的按鈕，不是 Drawer 內容）仍維持該頁面既有的繁體硬編碼慣例。

## Risks / Trade-offs

- [風險] 大幅重構、直接取代 001 剛完成但尚未經人工驗證的程式碼與頁面 → Mitigation：001 的驗證任務本身卡在開發環境問題（與本次改動無關），004 完成後兩張 CR 應合併一次性完整驗證；設計上盡量沿用 001 已驗證正確的部分（資料模型結構、`resolveAvatarUrl`／`UserAvatar`、`ConversationThread` 的訊息渲染邏輯），只改動授權/查詢/UI 外殼。
- [風險] Context Provider 掛在兩個平行 layout（`(user)`／`(admin)`），若未來又新增其他 route group（例如 `(guest)` 需要訊息功能）容易漏掛 → Mitigation：目前僅這兩個 group 需要登入態訊息功能，`(guest)` 本來就不該有此功能；design 已明確記錄掛載點，未來新增 route group 時可對照此清單檢查。
- [風險] Drawer 資料流採「初始資料 + 開啟時重新 fetch」而非即時推播，若使用者長時間停留在某頁面、其他人傳訊息給他，Topbar 角標不會即時更新（需重新整理頁面或導覽觸發新的 layout render）→ Mitigation：與既有 Notification 角標的更新時機一致（同樣依賴 revalidatePath／頁面重新載入），非本次新增的技術落差，屬於專案現況的既有限制。
- [風險] `findFirst` 用「雙方都在同一 Conversation 的參與者」判斷是否已有對話，若未來允許同一使用者對同一對象開多條獨立對話（例如「新對話」按鈕），此查詢邏輯需要重新設計（改成不再假設唯一） → Mitigation：本次比照 Messenger 明確限定「同對象僅一條」，非本次範圍的需求變更不處理。
- [風險] 移除管理者共享 inbox 特權後，若未來仍有「客服式集中處理」的實際需求（例如提問管理已有此模式），會需要另開 CR 重新引入指派/分組機制 → Mitigation：提出人已確認這次要拿掉此特權，若日後需要，`SupportInquiry`（提問管理）仍保留原有的管理者共享機制可用，不受本次影響。
