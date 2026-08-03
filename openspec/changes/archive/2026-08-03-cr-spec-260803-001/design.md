## Context

現有溝通管道（皆已存在，本次不修改）：
- `SupportInquiry`（`contact-admin`／`admin-inquiry-management`）：學員/講師 → 管理者，單次問答，非連續對話，所有管理者共享可見可回覆。
- `CourseMessage`（`course-faq`）：任何會員 → 該課程授課老師，1 對 1 可見，綁定 `CourseInvite`。

兩者都沒有「管理者主動對特定會員開啟對話」的路徑。需求提出人已確認：新增獨立的通用對話模型，UI 採 shadcn 新元件 `message`／`message-scroller`（chat-room 式，含自動滾動到底部行為），Avatar 先用預設圖示（不接真實大頭貼），資料模型需保留未來群組聊天的擴充彈性但本次僅做一對一。

`message`／`message-scroller` 兩個元件已在 `@shadcn` registry 確認存在（`npx shadcn@latest view @shadcn/message` / `@shadcn/message-scroller` 已驗證可取得原始碼），`message-scroller` 依賴 npm 套件 `@shadcn/react`（提供 `MessageScroller` primitive 與滾動相關 hook）與既有 `button` registry 元件。

## Goals / Non-Goals

**Goals:**
- 管理者可對任一會員（學員或講師）主動開啟一段對話，會員可回覆，形成雙向、連續（多輪）的對話串。
- 資料模型以「多對多參與者」設計（`ConversationParticipant`），讓未來群組聊天（同一對話多位非管理者參與者）不需要 schema 遷移。
- 沿用既有 Inbox 通知機制提示雙方有新訊息。

**Non-Goals（本次明確不做）：**
- 不做群聊 UI／群發：本次每個 `Conversation` 恰有一位非管理者參與者（即目標會員），未來若要群聊，改的是「誰可以被加入這個對話」的業務邏輯與 UI，資料表結構不必變動。
- 不做「若干管理者同一群組服務」的指派/分組機制——需求本身不清楚，留待未來 CR。本次維持「任一管理者皆可檢視回覆任何對話」（比照提問管理）。
- 不做逐則訊息已讀／未讀狀態、不做對話或訊息的未讀角標——倚賴既有 Notification／Inbox 機制提示有新訊息，與 `course-faq` 的既有慣例一致。
- 不做訊息分頁／lazy load——本次全量載入該對話所有訊息（預期單一對話訊息量不大，管理者對單一會員的溝通不會是高頻聊天）。
- 不做訊息刪除／編輯。
- 不做即時推播（無 WebSocket／SSE／輪詢）——訊息更新透過 Server Action 送出後 `revalidatePath`／`router.refresh()`，與現有 `course-faq`、`support-inquiry` 慣例一致。
- 不整合／不遷移 `SupportInquiry` 或 `CourseMessage` 既有資料，三套機制並存。
- 不做真實大頭貼（`MessageAvatar` 先用預設圖示／姓名縮寫佔位）。
- 會員端**不可**主動發起新對話——僅能在管理者已開啟的既有對話中回覆；主動聯繫管理者的方向仍由既有「提問管理」涵蓋。

## Decisions

### 資料模型

```prisma
// prisma/schema/conversation.prisma
model Conversation {
  id            Int      @id @default(autoincrement())
  createdById   String   @db.Uuid
  createdBy     User     @relation("ConversationCreatedBy", fields: [createdById], references: [id])
  createdAt     DateTime @default(now())
  lastMessageAt DateTime @default(now())

  participants ConversationParticipant[]
  messages     ConversationMessage[]

  @@index([lastMessageAt(sort: Desc)])
  @@map("conversations")
}

model ConversationParticipant {
  id             Int          @id @default(autoincrement())
  conversationId Int
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String       @db.Uuid
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())

  @@unique([conversationId, userId])
  @@index([userId])
  @@map("conversation_participants")
}

model ConversationMessage {
  id             Int          @id @default(autoincrement())
  conversationId Int
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  authorId       String       @db.Uuid
  author         User         @relation(fields: [authorId], references: [id])
  body           String       @db.Text
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
  @@map("conversation_messages")
}
```

`User`（`user.prisma`）補上反向關聯：`conversationsCreated Conversation[] @relation("ConversationCreatedBy")`、`conversationParticipations ConversationParticipant[]`、`conversationMessages ConversationMessage[]`。

**v1 應用層不變式（非 DB 約束，供未來群聊調整時參考）**：每個 `Conversation` 恰有一位非管理者（`!canAccessAdmin(user.roles)`）參與者，即目標會員；此不變式由 `startConversation` 只允許以會員為對象建立、且會員端無法自行發起對話來維持，非資料庫層級強制（未來群聊開放多位會員時，直接放寬即可，不必動 schema）。

### 找到/建立會員的對話

`startConversation(memberId, body)`（僅限 `canAccessAdmin`）：
1. `ConversationParticipant.findFirst({ where: { userId: memberId } })` 找該會員既有對話（v1 不變式保證此查詢等同「該會員唯一的對話」）。
2. 若已存在，等同呼叫 `sendConversationMessage`（同一交易邏輯，避免重複建立對話）。
3. 若不存在，於單一 `$transaction` 內：建立 `Conversation`（`createdById` = 目前管理者）→ 建立兩筆 `ConversationParticipant`（該會員、目前管理者）→ 建立第一則 `ConversationMessage`。
4. 通知該會員（`createNotification`）。

### 傳送訊息與通知範圍

`sendConversationMessage(conversationId, body)`：
- 授權：`canAccessAdmin(session.user.roles)` **或** 目前使用者已是該對話的 `ConversationParticipant`。其餘情況一律視為無權限（回傳一般錯誤訊息，不洩漏對話是否存在）。
- 建立 `ConversationMessage`；若寄件者為管理者且尚未是該對話的 `ConversationParticipant`，一併補建立該筆參與紀錄（讓「有回覆過的管理者」自然成為參與者，為未來群聊/已讀等擴充預留掛勾，不影響本次邏輯）。
- 更新 `Conversation.lastMessageAt`（供列表排序）。
- 通知範圍：查出目前所有 `ConversationParticipant` 對應的 `User.roles`，依 `canAccessAdmin` 分成「管理者參與者」與「會員參與者」兩組（v1 恆為 1 位會員 + 1 位以上管理者）；寄件者為管理者 → 通知會員參與者；寄件者為會員 → 通知所有管理者參與者（排除寄件者本人，邏輯上必然成立）。

### 授權查詢（會員端）

會員頁 `/user/{spiritId}/messages` 不吃 `conversationId` URL 參數，一律以「目前登入者本人」查詢 `ConversationParticipant.findFirst({ where: { userId: session.user.id } })` 取得自己的對話（若有），從根本避免 IDOR（無法用 URL 猜測他人對話 ID）；只有本人可存取自己的路徑（比照既有 `isOwnPage` 慣例，`/user/{spiritId}/messages` 需為 `spiritId` 對應本人，否則導向或 404，不顯示他人對話內容）。

管理者端 `/admin/messages/{id}` 依 `conversationId` 查詢，授權僅檢查 `canAccessAdmin`（後台已由 `(admin)` layout 統一守衛，頁面內不需重複判斷）。

### 共用 UI 元件

`components/conversation/conversation-thread.tsx`（`'use client'`）：
- 使用 `MessageScrollerProvider`／`MessageScroller`／`MessageScrollerViewport`／`MessageScrollerContent`／`MessageScrollerItem`／`MessageScrollerButton`（`components/ui/message-scroller.tsx`）包裹訊息列表，達成「新訊息自動捲到底部＋捲動歷史訊息時出現『回到底部』按鈕」的 chat-room 體驗。
- 每則訊息用 `Message`／`MessageAvatar`／`MessageContent`／`MessageHeader`（`components/ui/message.tsx`），`align` 依 `message.authorId === currentUserId ? 'end' : 'start'` 決定訊息靠左／靠右；`MessageAvatar` 內先放預設 `IconUser`（無真實頭像），`MessageHeader` 顯示寄件者顯示名稱。
- 底部固定訊息輸入框（`Textarea` + 送出 `Button`），呼叫傳入的 `onSend` callback（由頁面包一層對應 `startConversation`／`sendConversationMessage`），送出成功後清空輸入框、`router.refresh()`。
- Props 設計：`{ conversationId, currentUserId, messages, canReply, placeholder? }`——會員頁（一定已有 `conversationId`，`canReply` 恆為 true，因為頁面本身就是「本人的對話」）與管理者對話串頁（`canReply` 恆為 true）共用此元件；「尚無對話」的情境（會員端空狀態、管理者會員詳情頁分頁的起始表單）各自用簡單的 empty-state／獨立表單處理，不硬塞進共用元件。

### 安裝與依賴

執行 `npx shadcn@latest add message message-scroller`，會：
- 寫入 `components/ui/message.tsx`、`components/ui/message-scroller.tsx`
- 新增 npm 依賴 `@shadcn/react`（`message-scroller` 內部 import `MessageScroller as MessageScrollerPrimitive` 等）
- 確認既有 `components/ui/button.tsx`（`message-scroller` 的 registryDependency）已存在，不會重複安裝

### 文字語言策略

- 會員端（Topbar 圖示、`/user/{spiritId}/messages` 頁面所有文字、`conversation-thread.tsx` 若在會員頁使用時的文字）：依 CLAUDE.md 第 12 點，全部走 i18n key（新命名空間 `conversation`，如 `conversation.pageTitle`、`conversation.emptyState`、`conversation.placeholder`、`conversation.send`）；Zod 驗證訊息新增 `validation.conversationMessageRequired`／`validation.conversationMessageMax2000` key。
- 管理者端（`/admin/messages`、`/admin/messages/{id}`、會員詳情頁新分頁、後台首頁功能卡）：沿用專案現況，維持繁體中文硬編碼，不新增 i18n key（後台字串本階段維持繁體，比照既有 `/admin/*` 頁面慣例）。
- `conversation-thread.tsx` 為共用元件，內部不含固定文案字串（寄件者名稱、訊息內容皆為 props 傳入資料），僅輸入框 `placeholder` 與送出按鈕文字由呼叫端傳入/決定語言，避免共用元件本身混用 i18n 與硬編碼。

## Risks / Trade-offs

- [風險] 「若干管理者同一群組服務」需求被延後，若近期就有明確急迫性，管理者共享可見可能不符合實際期待（例如某些對話不想讓所有管理者看到）→ Mitigation：已與提出人確認此範圍不明確、留待未來 CR；本次維持與提問管理一致的「全體管理者共享可見」語意，不做技術上難以撤回的指派制設計。
- [風險] 每則管理者訊息都通知會員、每則會員回覆都通知已加入的管理者，高頻對話可能造成通知過多 → Mitigation：與 `course-faq`／`support-inquiry` 既有慣例一致（不做節流），且此功能預期使用頻率不高（管理者主動聯繫，非日常聊天工具）；如日後成為問題，可另開 CR 加節流或改為摘要通知。
- [風險] `message`／`message-scroller` 是 shadcn 較新的元件、專案內尚無先例整合經驗，可能有未預期的樣式或相依套件問題 → Mitigation：實作階段先以最小可行方式（單一對話串、無虛擬捲動）驗證整合是否順利，若遇到嚴重相容性問題，退回方案為改用專案既有的簡單清單＋卡片樣式（比照 `course-faq` 留言區塊呈現），僅犧牲自動捲動到底部的體驗，不影響核心資料流。
- [風險] `ConversationParticipant` 找會員既有對話的查詢（`findFirst({ where: { userId: memberId } })`）依賴「v1 每位會員只會被加入自己那一條對話」的應用層不變式，若未來群聊功能上線時沒有同步調整這段查詢邏輯，可能誤判 → Mitigation：已在本文件明確標註此為 v1 專屬假設，未來群聊 CR 需重新設計「找對話」的查詢邏輯（例如改用會員的對話清單而非單一 `findFirst`）。
