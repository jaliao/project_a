## Why

`cr-spec-260803-001` 剛完成「管理者主動聯繫學員/講師」的站內訊息功能：僅管理者可發起對話、每位會員恆只有一條對話、任一管理者可共享檢視回覆任何對話、獨立頁面呈現（`/user/{spiritId}/messages`、`/admin/messages`）。需求提出人（Justin）現在要求把它擴充成通用的會員對會員訊息系統，比照 FB Messenger／IG 私訊的心智模型：任何會員都可以互傳訊息（不限管理者對學員），一個人可以同時有多筆各自獨立的對話（不同對象各一條），並改用 shadcn `Drawer` 呈現「頻道列表＋切換」的介面，取代原本的獨立頁面。

經與提出人確認兩個關鍵架構決策：
- **管理者不再有「共享檢視任何對話」的特權**：管理者比照一般會員，只能看到／回覆自己實際參與的對話（既有的「任一管理者可看到任何對話」機制連帶被移除，含 `/admin/messages` 列表頁、會員詳情頁「站內訊息」分頁、後台首頁功能卡）。
- **完全改用 Drawer，不保留獨立頁面**：Topbar「訊息」圖示點擊後直接從畫面右側滑出 Drawer，內含頻道列表（可切換）＋目前選中頻道的訊息記錄＋回覆輸入框，可在任何頁面開啟，不需要導覽到專屬路由。

## What Changes

- **開放對象**：任何登入會員都能對任何其他會員（不含自己）發起訊息，不再限定管理者。「站內訊息」更名為「訊息」（UI 顯示文字，不動路由/程式碼識別字）。
- **一人多筆對話**：資料模型本身已是多對多參與者設計（`ConversationParticipant`），不需要 schema 遷移即可支援；查詢邏輯由「假設每人僅一條對話」改為「回傳使用者參與的所有對話列表」。同一組對象之間（A↔B）仍僅維持一條持續對話（找不到才新建，找到就併入既有對話），比照 Messenger 慣例，不會重複開新對話串。
- **移除管理者特權**：`sendConversationMessage` 的授權從「管理者或參與者」簡化為「僅該對話參與者」；移除 `/admin/messages`、`/admin/messages/{id}`、會員詳情頁「站內訊息」分頁、後台首頁「站內訊息」功能卡。
- **Drawer UI**：新增全域可觸發的 `MessageDrawer`（`components/conversation/`），透過 Context Provider（掛在 `(user)/layout.tsx` 與 `(admin)/layout.tsx`）讓任何頁面的任何按鈕呼叫 `openMessageDrawer(targetUserId?)` 開啟；Drawer 內為「頻道列表＋選中頻道訊息記錄＋輸入框」單一畫面，取代原本的 `/user/{spiritId}/messages`、`/admin/messages/{id}` 兩個獨立頁面。
- **新增入口**：
  1. Topbar「訊息」圖示：點擊開啟 Drawer（不帶指定對象，顯示頻道列表）。
  2. 學員專屬頁面 `/user/{spiritId}` 基本資料區塊：新增「傳訊息」按鈕，僅他人頁面顯示（不可對自己傳訊息），點擊開啟 Drawer 並直接開啟/建立與該會員的對話。
  3. 後台會員詳情頁 `/admin/members/{id}`：原本的「站內訊息」分頁改為「傳訊息」按鈕（頁首操作區），行為同上。
- **未讀提示**：`ConversationParticipant` 新增 `lastReadAt`，Drawer 頻道列表標示未讀對話；Topbar「訊息」圖示疊加未讀角標（比照既有通知鈴鐺角標樣式），開啟該頻道即標記已讀。
- **文案語言**：Drawer 為前後台共用元件（管理者現在只是「一般會員」身份在使用同一套功能），統一走 i18n（會員端既有 `conversation` 命名空間），不再區分前後台語言策略；後台會員詳情頁的「傳訊息」按鈕本身仍維持後台既有繁體硬編碼慣例。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `contact-member`：由「管理者主動聯繫學員/講師」擴充為「任何會員互傳訊息」，發起對象、多筆對話、Drawer UI、未讀提示皆為新行為，全面取代原有需求內容
- `admin-conversation-management`：整個 capability 移除（管理者不再有特殊訊息管理功能，相關列表頁/分頁/後台功能卡皆移除）

## Impact

- **Schema**：`prisma/schema/conversation.prisma` 的 `ConversationParticipant` 新增 `lastReadAt DateTime?`；純新增欄位，無破壞性變更，`Conversation`／`ConversationMessage` 結構不變。
- **Data Layer**（`lib/data/conversation.ts`，大幅重寫）：新增 `getMyConversations(userId)`（回傳所有參與對話，含對方顯示名稱/頭像/最新訊息預覽/未讀狀態）、`getUnreadConversationCount(userId)`（Topbar 角標用）；移除 `getMyConversation`（單數）、`getConversationList`、`getConversationDetail`、`getMemberConversationSummary`（管理者專屬查詢，不再需要）。
- **Server Actions**（`app/actions/conversation.ts`，大幅重寫）：`startConversation` 開放給任何登入使用者對任何其他使用者（含找既有對話/建立新對話的邏輯）；`sendConversationMessage` 授權簡化為僅參與者；新增 `markConversationRead`、`fetchMyConversations`、`fetchConversationMessages`（供 Client Component／Drawer 讀取資料用的 Server Actions）。
- **新增**：`components/conversation/message-drawer-provider.tsx`（Context + Provider）、`components/conversation/message-drawer.tsx`（Drawer 本體 UI）；`npx shadcn@latest add drawer`（新增 npm 依賴 `vaul`）。
- **修改**：`components/conversation/conversation-thread.tsx`（沿用為 Drawer 內部訊息記錄子元件，移除固定單一 conversationId 假設）、`components/layout/topbar.tsx`（訊息按鈕改觸發 Drawer＋未讀角標）、`app/[locale]/(user)/user/[spiritId]/page.tsx`（新增「傳訊息」按鈕）、`app/[locale]/(admin)/admin/members/[id]/page.tsx`（分頁改按鈕）、`app/[locale]/(user)/layout.tsx`／`app/[locale]/(admin)/layout.tsx`（掛載 Provider、傳入初始對話列表與未讀數）、`messages/zh-TW.json`／`en.json`（`nav.messages` 改名、新增 Drawer 文案）。
- **移除**：`app/[locale]/(user)/user/[spiritId]/messages/`（整個資料夾）、`app/[locale]/(admin)/admin/messages/`（整個資料夾）、`components/admin/member-start-conversation-form.tsx`；`app/[locale]/(admin)/admin/page.tsx` 的「站內訊息」功能卡。
- **不修改**：`SupportInquiry`（提問管理）、`CourseMessage`（課程 FAQ）——與前次 CR 一致，三套機制並存，本次僅擴充 `Conversation` 系統本身。
