## 1. 資料模型

- [x] 1.1 `prisma/schema/conversation.prisma`：`Conversation` 新增 `title String?`；`ConversationParticipant` 新增 `pinnedAt DateTime?`
- [x] 1.2 執行 `make schema-update name=add_conversation_title_and_pin`（純新增欄位，無破壞性變更）

## 2. Data Layer 調整（lib/data/conversation.ts）

- [x] 2.1 新增 `resolveDisplayTitle(title, others)`：`title` 有值則回傳 `title`；否則依其他參與者名稱組合（≤3 位列出全部、>3 位取前 3 位＋「等 N 人」）
- [x] 2.2 `findOther` 改寫（或新增 `findOthers`）：回傳「除 viewerId 外的所有其他參與者」陣列，取代原本假設恰一位的邏輯
- [x] 2.3 `ConversationSummary` 型別新增 `displayTitle`、`isGroup`（`others.length > 1`）、`isPinned`；`getMyConversations` 一併查出 `title`／`pinnedAt`，排序邏輯改為「已釘選（依 pinnedAt 倒序）優先，其餘依 lastMessageAt 倒序」
- [x] 2.4 `ConversationWithMessages` 型別新增 `title`（原始值，供編輯用）、`displayTitle`、`participants`（完整參與者列表：`userId`／`name`／`avatarUrl`）；`getConversationMessages` 一併查出並回傳
- [x] 2.5 新增 `findConversationsWithUser(viewerId, targetUserId)`：回傳 viewerId 與 targetUserId 皆為參與者的所有對話。實作時把舊 `previewConversationWithUser` 拆成兩個職責更單一的函式：`findConversationsWithUser`（純查找既有對話列表）＋ `previewNewConversationWithUser`（純組出尚未建立對話的預覽資料），呼叫端自行依「找到的列表是否為空」決定走哪一條

## 3. Server Actions 調整（app/actions/conversation.ts）

- [x] 3.1 新增 `fetchConversationsWithUser(targetUserId)`：登入檢查、包裝 `findConversationsWithUser(session.user.id, targetUserId)`，供 Drawer「傳訊息」選擇畫面使用
- [x] 3.2 新增 `inviteToConversation(conversationId, targetUserId)`：登入檢查、確認呼叫者為參與者、確認 targetUserId 存在、若尚未是參與者則建立 `ConversationParticipant`（已是參與者視為成功 no-op）、通知被邀請人。實作時第二參數改為 `targetSpiritId`（以啟動編號查找對象，理由同 proposal.md／design.md 已補充說明：一般會員只知道對方啟動編號，不知道內部 UUID）
- [x] 3.3 新增 `updateConversationTitle(conversationId, title)`：登入檢查、確認為參與者、`title` trim 後為空存 `null`、長度上限 100 字驗證、更新 `Conversation.title`
- [x] 3.4 新增 `togglePinConversation(conversationId)`：登入檢查、確認為參與者、切換該筆 `ConversationParticipant.pinnedAt`（`null` ↔ `new Date()`）
- [x] 3.5 `startConversation`：移除內部自動查找既有對話的邏輯（不再假設唯一對話），改為總是建立一筆新對話——是否接續既有對話已由前端「選擇畫面」決定；`fetchOrPreviewConversation` 移除，改為 `fetchConversationsWithUser`＋`fetchPreviewNewConversation` 兩個職責分離的 action；`notifyOthers` 既有「排除寄件者」邏輯在群組下語意正確，未變動

## 4. Drawer UI 調整

- [x] 4.1 `components/conversation/message-drawer.tsx`：`DrawerContent` 樣式改為滿版（改用 `data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-none`，與 base `drawer.tsx` 的 `data-[vaul-drawer-direction=right]:` modifier 對齊才能正確覆蓋，純 `w-full sm:max-w-none` 因 tailwind-merge 不視為同一 class group、會被 data-attribute 選擇器的更高優先權蓋掉，實測後修正）；`DrawerHeader` 新增明確關閉按鈕（`IconX` 呼叫 `onOpenChange(false)`，透過 `DrawerClose asChild`）
- [x] 4.2 新增「選擇既有對話 or 開新對話」畫面：`openMessageDrawer(targetUserId)` 觸發時，若 `fetchConversationsWithUser` 回傳非空陣列，顯示此畫面（列出既有對話卡片 + 「開新對話」按鈕），選定後才進入正式對話畫面；若為空陣列則直接進入新對話畫面（沿用現行行為）
- [x] 4.3 頻道列表：改用 `displayTitle`／`isGroup`（群組顯示 `IconUsers` 通用圖示，1:1 顯示 `UserAvatar`）；已釘選項目加上釘選視覺標示（`IconPinFilled`）
- [x] 4.4 對話詳情區新增「對話資訊」子區塊：顯示/編輯標題（點擊鉛筆圖示進入編輯模式）、參與者列表（頭像＋名稱）、「邀請成員」入口（輸入啟動編號後呼叫 `inviteToConversation`）、釘選切換按鈕（呼叫 `togglePinConversation`）
- [x] 4.5 `components/conversation/message-drawer-provider.tsx`：新增對應 state 與 handler（選擇模式的候選對話列表、標題更新、釘選切換、邀請成員後重新整理參與者列表），送出/操作成功後重新呼叫 `fetchConversationMessages`／`fetchMyConversations` 更新畫面

## 5. i18n

- [x] 5.1 `messages/zh-TW.json`：`conversation` 命名空間新增本次相關文案（`close`、`pickerHint`、`startNewConversation`、`titlePlaceholder`、`invitePlaceholder`、`inviteSuccess`、`inviteFail`）
- [x] 5.2 `messages/en.json` 補上對應英文翻譯
- [x] 5.3 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 6. 驗證

- [x] 6.1 `npx tsc --noEmit`、`npm run lint` 通過（0 errors；16 個既有警告與本次改動無關）
- [x] 6.2 已用 Playwright 對真實開發環境實測：會員 A（student2）對已有一筆既有對話的會員 B（student3）點擊「傳訊息」，正確顯示選擇畫面（既有對話 + 開新對話）；選擇既有對話可正常接續回覆
- [x] 6.3 於選擇畫面點擊「開新對話」，正確建立與 B 之間的第二筆獨立對話，兩筆對話各自訊息未互相混雜
- [x] 6.4 於群組對話邀請會員 C（student1）加入，C 立即可在自己的 Drawer 看到該對話並成功回覆，且 DB 確認收到「已被加入對話」通知；「非參與者無法邀請他人」由程式碼保證（`inviteToConversation` 的 `isParticipant` 檢查，無此情境的 UI 入口可供瀏覽器實測，故以程式碼檢視為準）
- [x] 6.5 邀請至 4 位其他參與者（B、C、D、E）後，頻道列表正確顯示 `IconUsers` 群組圖示，且自動組合標題正確截斷為「前 3 位／等 4 人」
- [x] 6.6 修改對話標題後，A 與另一位參與者 C 皆立即看到新標題；清空標題後正確恢復自動組合命名
- [x] 6.7 釘選對話後排到頻道列表最上方（截圖確認）；取消釘選後恢復依時間排序；B 的頻道列表順序與釘選狀態不受 A 釘選動作影響（截圖確認）
- [x] 6.8 Drawer 實測為滿版寬度（bounding box 寬度 = viewport 寬度），且有明確可點擊的關閉按鈕（`aria-label="關閉"`）可以關閉
