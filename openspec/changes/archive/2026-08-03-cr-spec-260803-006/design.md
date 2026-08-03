## Context

`cr-spec-260803-004`（尚未封存）建立了「任何會員互傳」的訊息系統，但兩個關鍵限制正是本次要拿掉的：`startConversation` 用「雙方都在同一 Conversation」判斷是否已有對話，假設同一對象間永遠只有一條；`getMyConversations`／`getConversationMessages` 的 `findOther` 假設「除自己外恰有一位參與者」。004 的 design.md 當時已明確記錄「若未來做群聊，需要重新設計此查詢」——本次正是這個「未來」。

`ConversationParticipant` 從 001 開始就是多對多中介表設計，資料模型本身完全不需要為了支援多人而改結構，只需要：①拿掉應用層「恰 2 位參與者」的假設；②新增 `title`（群組需要可辨識名稱）、`pinnedAt`（釘選）兩個欄位。

因為 004 尚未封存進主規格，本次 delta 一樣直接對 `contact-member` 寫 `MODIFIED`，語意上是「基於 004 已完成的成果做修改」，封存時依序（001 → 004 → 006）疊加。

## Goals / Non-Goals

**Goals:**
- 同一對象間可以有多筆獨立對話，「傳訊息」時可選擇接續既有對話或開新對話。
- 任一參與者可邀請其他會員直接加入對話（變成群組），不需對方同意。
- 對話可自訂標題（任一參與者可改），未設定時自動組合參與者名稱顯示。
- 任一參與者可釘選/取消釘選對話，釘選對話優先顯示於頻道列表頂部。
- Drawer 改為滿版，並提供明確關閉方式。

**Non-Goals（本次明確不做）：**
- 不做系統事件訊息（成員加入／標題變更等操作不自動產生一則對話訊息記錄，僅反映在即時狀態）。
- 不做移除成員／退出群組。
- 不做邀請權限分級（無管理員角色，任一參與者權限相同，含邀請、改標題）。
- 不做已讀回條明細（誰讀了、誰沒讀），沿用「我是否有未讀」的既有單向邏輯，不因群組而擴充。
- 不做「新對話」以外的既有對話合併/刪除工具。
- 不因本次多人化而重新設計通知節流機制，沿用「通知除寄件者外的所有參與者」（群組時等於通知所有其他成員，符合直覺）。

## Decisions

### 資料模型異動

```prisma
// prisma/schema/conversation.prisma
model Conversation {
  // ...既有欄位不變...
  title String? // 自訂標題；null = 未設定，顯示時自動組合參與者名稱
}

model ConversationParticipant {
  // ...既有欄位不變...
  pinnedAt DateTime? // 該使用者釘選此對話的時間；null = 未釘選
}
```

### 顯示名稱／頭像邏輯（取代「唯一對方」假設）

新增 `resolveConversationDisplayTitle(title, otherParticipants)`：
```ts
function resolveDisplayTitle(title: string | null, others: { name: string }[]): string {
  if (title) return title
  if (others.length === 0) return '（無其他成員）'
  if (others.length <= 3) return others.map((o) => o.name).join('、')
  return `${others.slice(0, 3).map((o) => o.name).join('、')} 等 ${others.length} 人`
}
```
- 1:1 對話（`others.length === 1`）沿用原本「顯示對方姓名」的直覺行為，不需特殊分支。
- 群組頭像：不試圖顯示「某一位」參與者頭像造成誤導，改用固定群組圖示（`IconUsers`）；1:1 對話（`others.length === 1`）才顯示對方真實頭像（`UserAvatar`）。

### 找/選對話邏輯（取代「唯一既有對話」假設）

新增 `findConversationsWithUser(viewerId, targetUserId): ConversationSummary[]`：查出「viewerId 與 targetUserId 皆為參與者」的所有對話（不再假設唯一），依 `lastMessageAt` 倒序。

`openMessageDrawer(targetUserId)` 行為調整：
1. 呼叫 `fetchConversationsWithUser(targetUserId)`。
2. 若空陣列 → 直接進入「新對話預覽」狀態（同 004 既有行為）。
3. 若有 1 筆以上 → 進入「選擇模式」：Drawer 顯示這些既有對話（可點選其一接續）＋一個「開新對話」按鈕；使用者選擇後才真正載入/建立該對話。

Topbar「訊息」圖示（不帶 `targetUserId`）行為不變：直接顯示完整頻道列表，不觸發「選擇模式」（選擇模式僅發生在「傳訊息給特定對象」的入口）。

### 群組邀請

新增 `inviteToConversation(conversationId, targetSpiritId)`（實作時改以「啟動編號」查找對象，取代 `targetUserId`——一般會員彼此互動時只會知道對方的啟動編號，不會知道內部 UUID，與現有「傳訊息」等入口的慣例一致）：
1. 登入檢查、確認呼叫者為該對話參與者（任一參與者皆可邀請）。
2. 依 `targetSpiritId` 查出對應使用者存在、且尚未是該對話參與者（已是參與者則視為 no-op，回傳成功）。
3. 建立新的 `ConversationParticipant`（`lastReadAt`／`pinnedAt` 皆為 `null`）。
4. 通知被邀請人（Inbox：「您已被加入一段對話」）。
5. 不寫入系統事件訊息（Non-Goal）。

Drawer 內對話詳情區新增「成員列表＋邀請」UI：列出目前所有參與者（頭像＋名稱），提供一個簡單的「邀請」輸入（沿用既有會員搜尋/選擇模式，若專案已有可重用的會員選擇元件則沿用，否則以最簡單的形式提供，例如貼上 spiritId 或從最近聯絡人挑選——實作時依 tasks 具體化，設計不強制特定 UI 元件，只要求「任一參與者可從對話內觸發邀請」）。

### 對話標題

新增 `updateConversationTitle(conversationId, title)`：
1. 登入檢查、確認為參與者。
2. `title` trim 後為空字串時存為 `null`（清空、恢復自動命名）；否則存為輸入值（長度上限比照訊息內容慣例訂為 100 字，避免無限制輸入）。

Drawer 內對話詳情區提供可編輯的標題欄位（點擊顯示的標題即可編輯，或提供獨立的「編輯」按鈕，實作時擇一，不影響行為契約）。

### 釘選

新增 `togglePinConversation(conversationId)`：
1. 登入檢查、確認為參與者。
2. 若目前 `pinnedAt` 為 `null` → 設為 `new Date()`；否則設為 `null`（切換）。

`getMyConversations` 排序邏輯調整：先依 `pinnedAt`（有值者優先，値越新越前）分組，同組內再依 `lastMessageAt` 倒序；未釘選的對話整組排在已釘選之後、同樣依 `lastMessageAt` 倒序。

### Drawer 滿版與關閉方式

`components/ui/drawer.tsx` 的 `direction="right"` 樣式維持不動（shadcn 生成檔案），改在 `MessageDrawer` 自身的 `DrawerContent` 透過 `className` override 寬度。實作時發現純 `w-full sm:max-w-none` 無效——base 元件的寬度樣式是掛在 `data-[vaul-drawer-direction=right]:` modifier 下（`data-[vaul-drawer-direction=right]:w-3/4 ... sm:max-w-sm`），與不帶 modifier 的 override 不屬於同一個 tailwind-merge class group，兩者都會被保留輸出，實際 CSS cascade 又因帶 data-attribute 選擇器的規則優先權較高而蓋掉 override，導致 Drawer 仍維持原本的窄版寬度。修正後改用相同 modifier 前綴：`data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-none`，實測寬度已等於 viewport 寬度。`DrawerHeader` 新增明確的關閉按鈕（`IconX` + `onOpenChange(false)`，透過 `DrawerClose asChild`），不依賴滿版後已不存在的外部遮罩點擊關閉手段。

## Risks / Trade-offs

- [風險] 本次是連續第三次修改 `contact-member`，且前一版（004）尚未經人工驗證即被再次大改，風險持續累積 → Mitigation：001／004／006 完成後應合併一次性完整驗證，非本次 CR 獨立驗證；設計上盡量沿用 004 已驗證正確的底層邏輯（訊息渲染、頭像 fallback、通知機制），只調整「找對話」「顯示名稱」等因多人化而必須改變的部分。
- [風險] 「選擇既有對話 or 開新對話」的中介畫面若既有對話很多（例如某人被大量邀請進很多群組），列表可能很長 → Mitigation：本次不做分頁（沿用現有簡化決策），畫面上明確排序（最新在前），若日後成為問題可另開 CR 加搜尋/分頁。
- [風險] 邀請不需同意，理論上任何參與者都能把不相關的人拉進對話，可能造成困擾 → Mitigation：提出人已確認這是內部工具、比照 Slack/Teams 模式，且本次無「退出群組」功能，若拉錯人需要另外處理（記錄為已知限制，非本次要解決的問題）。
- [風險] 標題長度上限（100 字）與訊息驗證的既有慣例（2000 字）不同、且是本次新訂，若提出人實際使用時覺得不夠可再調整 → Mitigation：明確記錄於本文件，屬於實作細節，非行為契約的核心部分。
