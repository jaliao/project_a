## Why

目前系統只有「學員／講師 → 管理者」單方向的溝通管道：
- **提問管理**（`SupportInquiry`）：學員或講師主動送出提問，管理者被動回覆，屬單次問答（非連續對話）。
- **課程 FAQ**（`CourseMessage`）：任何會員可在特定課程頁發問，僅該課程授課老師可回覆；綁定單一課程場次，且發問者不限管理者。

管理者本身沒有任何管道可以「主動」對某位特定學員或講師開啟一段對話（例如講師對課程規則有各種創意解讀時，管理者需要主動去說明澄清）。需求提出人（Justin）明確表示：現有「找得到管理員」的方向已經有了，缺的是「管理者可以主動 cue 到會員」這個方向，希望補上，讓兩個方向合起來構成雙向溝通。

經與提出人確認範圍：
- 採用全新的**通用對話／訊息模型**（類似聊天室的連續對話），不與 `SupportInquiry` 合併或取代，也不修改課程 FAQ；UI 採用 shadcn 新元件 `message`／`message-scroller`（chat scroll 行為）。
- 資料模型需保留未來擴充「群組聊天」（多位會員同一對話）的彈性，但**本次僅實作管理者與單一會員的一對一對話**，不做群聊 UI／群發功能。
- 適用對象：學員與講師皆可被管理者主動聯繫（不限講師）。
- 需求描述中「若干管理者要在同一個群組服務」的訴求範圍不清楚，**不在本次範圍內**，留待未來另一張 CR 澄清後處理。

## What Changes

- 新增 `Conversation` / `ConversationParticipant` / `ConversationMessage` 資料模型：`ConversationParticipant` 採多對多中介表設計（而非在 `Conversation` 上放單一 `memberId` 外鍵），使未來群組聊天只需允許同一對話有多位非管理者參與者，不需 schema 遷移。
- **管理者端**：
  - 管理後台首頁新增「站內訊息」功能卡，導向 `/admin/messages`。
  - `/admin/messages`：列出所有對話（會員顯示名稱、最新訊息預覽、最新訊息時間），依最新訊息時間倒序。
  - `/admin/messages/{id}`：對話串頁面（訊息記錄＋回覆輸入框）。
  - 會員詳情頁（`/admin/members/{id}`）新增「站內訊息」分頁：尚無對話時顯示發送新訊息表單（送出即建立對話並導向對話串頁）；已有對話時顯示「查看完整對話」連結。
  - 任一管理者／superadmin 皆可檢視、回覆任何對話（比照提問管理，共享可見、非指派制）。
- **會員端（學員與講師皆適用）**：
  - Topbar 新增「站內訊息」圖示，導向 `/user/{spiritId}/messages`。
  - `/user/{spiritId}/messages`：顯示自己與管理者的對話串（若管理者已主動開啟過），可回覆；尚無對話時顯示空狀態（會員本身**不可**主動發起新對話，此方向仍由提問管理涵蓋）。
- **通知**：管理者傳送訊息時，通知該對話目前已加入的會員；會員回覆時，通知該對話目前已加入的管理者（初始僅發起的管理者；若後續有其他管理者也在此對話回覆過，一併通知）。皆重用既有 `Notification`／Inbox 機制，不做即時推播（無 WebSocket／輪詢）。
- **明確不做**（Non-Goals，詳見 design.md）：不做群聊 UI／群發、不做逐則已讀狀態與未讀角標、不做訊息分頁／lazy load、不做訊息刪除／編輯、不處理「若干管理者同一群組服務」的指派/分組需求、不與 `SupportInquiry`／課程 FAQ 整合或遷移既有資料。

## Capabilities

### New Capabilities
- `contact-member`：會員端——管理者主動聯繫學員/講師的雙向對話（Topbar 入口、`/user/{spiritId}/messages` 頁面、回覆、通知）
- `admin-conversation-management`：管理者端——站內訊息管理（後台功能卡、列表頁、對話串頁、會員詳情頁分頁、發起對話、回覆、通知）

### Modified Capabilities
（無——不修改 `contact-admin`／`course-faq`／`admin-inquiry-management` 既有行為）

## Impact

- **Schema**：新增 `prisma/schema/conversation.prisma`（`Conversation`／`ConversationParticipant`／`ConversationMessage`），`prisma/schema/user.prisma` 補上 `User` 的反向關聯欄位；純新增資料表，無破壞性變更，一般 `make schema-update` 即可。
- **Server Actions**：新增 `app/actions/conversation.ts`（`startConversation`、`sendConversationMessage`）。
- **Data Layer**：新增 `lib/data/conversation.ts`（會員本人對話查詢、管理者列表查詢、單一對話串查詢，皆含權限過濾）。
- **Schema (Zod)**：新增 `lib/schemas/conversation.ts`（訊息內容驗證，trim 後 1–2000 字，走 `validation.*` i18n key）。
- **共用元件**：新增 `components/conversation/conversation-thread.tsx`（`use client`，基於 shadcn `message`／`message-scroller` 家族元件，會員頁與管理者對話串頁共用；Avatar 先用預設圖示，不接真實頭像）。
- **會員端頁面**：新增 `app/[locale]/(user)/user/[spiritId]/messages/page.tsx`；`components/layout/topbar.tsx` 新增圖示；`messages/zh-TW.json`／`messages/en.json` 新增 `nav.messages`、`conversation.*`、`validation.conversationMessage*`，並執行 `npm run gen:zh-cn`。
- **管理者端頁面**：新增 `app/[locale]/(admin)/admin/messages/page.tsx`、`app/[locale]/(admin)/admin/messages/[id]/page.tsx`；`app/[locale]/(admin)/admin/page.tsx` 新增功能卡；`app/[locale]/(admin)/admin/members/[id]/page.tsx` 新增分頁。管理者端文字沿用專案現況（後台字串本階段維持繁體硬編碼，不新增 i18n key），會員端文字則依 CLAUDE.md 第 12 點走 i18n。
- **通知**：重用既有 `createNotification`（`app/actions/notification.ts`），不新增通知相關 schema。
- **UI 元件安裝**：透過 `npx shadcn@latest add message message-scroller` 安裝，會新增 npm 依賴 `@shadcn/react`（`message-scroller` 內部使用）。
