## Context

`Conversation`／`ConversationParticipant` 模型（`prisma/schema/conversation.prisma`）已支援任意人數參與（1:1 或群組），但目前只有「邀請加入」（`inviteToConversation`），沒有「移除自己」的操作。對話成員彈窗 `ConversationMembersDialog` 已存在成員清單與邀請 UI，是新增「離開」操作最自然的落點。

## Goals / Non-Goals

**Goals:**
- 群組對話（目前參與者 > 2 人）的任一參與者可自行離開，只影響自己
- 離開後該使用者的頻道列表立即少一筆，若正檢視該對話則回到未選取狀態
- 一對一對話不提供「離開」（本次需求明確限定「聊天群組」）

**Non-Goals:**
- 不做「踢除他人」（僅能離開自己所在的對話，不影響邀請/移除他人的既有／未來機制）
- 不發送「某人已離開群組」的系統訊息或通知給其他成員（保持與 `removeFriend`「移除好友不通知對方」一致的低調行為，非本次需求要求）
- 不處理「最後一人離開後的對話清理」（對話與訊息記錄永久保留，即使參與者歸零；不主動封存或刪除 `Conversation`）
- 不新增「重新加入」自助機制（離開後僅能靠其他參與者重新邀請）

## Decisions

### 1. 「群組」的判斷：離開當下參與者數 > 2，動態評估、不記錄於建立時
不新增 `isGroup` 欄位，直接以 `ConversationParticipant` 的即時計數判斷。UI（成員彈窗）與 server action 皆以「目前參與者數 > 2」作為是否允許離開的條件，兩處各自即時查詢，確保一致。理由：與既有 `contact-member` 規格對「群組對話」的定義（參與者超過 2 位）完全一致，且無需 migration。

**邊界案例**：3 人群組 A 離開後剩 B、C（2 人）——此時 B、C 視角下該對話已「降級」為一對一對話，成員彈窗不再顯示「離開」按鈕，B、C 无法再互相離開。這是刻意選擇：一對一對話本來就沒有「離開」概念（不在本次需求範圍），降級後自然不再適用；如未來需要「退出 1:1 對話」是另一個獨立需求，不在此次處理。

### 2. Server action 端仍需重複驗證參與者數（不能只靠前端隱藏按鈕）
`leaveConversation` 內部：① 驗證呼叫者為該對話參與者；② 查詢目前參與者總數，若 ≤ 2 則拒絕（`message: '此非群組對話，無法離開'`）；③ 刪除呼叫者的 `ConversationParticipant` 列。避免使用者繞過 UI 直接呼叫 action 在 1:1 對話上執行「離開」。

### 3. 離開後不清理 `Conversation`／`ConversationMessage`
即使離開後參與者歸零，`Conversation` 與其 `ConversationMessage` 仍保留在資料庫（不做 cascade 刪除、不做 orphan 清理批次工作）。理由：訊息記錄本身有價值（不因為所有人都離開就該消失），且清理邏輯增加不必要複雜度；孤兒對話沒有任何參與者可查詢到，實務上無害。

## Risks / Trade-offs

- [風險] 群組降到 2 人後兩人都無法再「離開」，只能透過移除好友或不理會對話 → 緩解：符合現有系統「1:1 對話沒有離開概念」的既有設計，且雙方仍可透過忽略對話（訊息仍會通知但無強制已讀）自然降低互動，非本次需求要解決的問題。
- [風險] 離開群組不通知其他成員，其他成員可能誤以為對方仍在群組中而持續 @ 或依賴其回覆 → 緩解：與 `removeFriend`／`cancelLearningIntent` 等既有「安靜」操作一致，且成員清單（成員彈窗）本身就是查證目前參與者的管道，不需額外系統訊息。

## Migration Plan

不需要 migration（沿用既有 `ConversationParticipant` 表，`leaveConversation` 僅執行既有欄位上的 `delete`）。可直接隨版本上線，無資料相容性疑慮。
