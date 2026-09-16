## Context

`cr-spec-260916-004` 建立了通用「學員選擇元件」`StudentPicker`（`components/shared/student-picker.tsx`）與資料層 `searchStudentCandidates`（`lib/data/student-picker.ts`），設計上刻意不含任何授權或資料範圍邏輯：搜尋交給呼叫端傳入的 `onSearch` callback，排除清單交給呼叫端傳入的 `excludeUserIds`，選定結果透過 `onSelect` callback 回傳，完全由呼叫端決定要拿選定的 `userId` 做什麼。目前唯一呼叫端是「新增學員」（`components/admin/invite-student-cells.tsx` + `app/actions/invite-students.ts` 的 `searchStudentsForInvite`）。

調查確認另外兩處「選會員」介面（課程分享的內建訊息邀請、社群訊息的加入成員）目前都是各自維護的舊版輸入邏輯，且與 `StudentPicker` 的排除清單機制語意完全相容（皆可化約為「一組要排除的 userId」）。

## Goals / Non-Goals

- Goals：兩個既有情境改用 `StudentPicker`，統一「選會員」的操作體驗；比照 `cr-spec-260916-004` 已示範過的模式（呼叫端新增一個 `searchXxx` action 包裝 `searchStudentCandidates`，主 action 改吃 `userId`）複製兩份。
- Non-Goals：不修改 `StudentPicker` 元件本身或 `searchStudentCandidates`（已確認無需修改）；不批次搜尋/邀請多人（`StudentPicker` 本身是單選設計，維持現狀）；不處理 `StudentPicker` 內部文案未走 i18n（沿用專案既有寫死中文的狀態，屬 `cr-spec-260916-004` 的既有技術債，非本次範圍）。

## Decisions

### 1. 兩處都新增各自的 `searchXxx` action，而非共用一個通用 search action
- `searchMembersForCourseInvite(inviteId, query)`：權限比照 `inviteMemberByMessage`／`searchStudentsForInvite`——該課講師或管理者。`excludeUserIds` 傳空陣列 `[]`（`searchStudentCandidates` 本身已排除操作者自己，且此情境不需要排除任何既有名單，例如允許邀請已經是好友或已邀請過的人再次收到訊息）。
- `searchMembersForConversation(conversationId, query)`：權限為「操作者必須是該對話參與者」（比照 `inviteToConversation`／`sendConversationMessage` 既有的 `isParticipant` 檢查）。`excludeUserIds` 由伺服器端重新查詢該對話目前的參與者 `userId` 清單（不信任前端傳來的清單，避免過期或被竄改）。
- 不做成一個通用 `searchMembersGeneric(scope, scopeId, query)` action：兩者的授權檢查邏輯本質不同（課程歸屬 vs 對話參與者），硬拗成一個泛用 action 只會讓權限檢查邏輯彼此耦合、增加誤用風險；各自一個小 action（如既有 `searchStudentsForInvite`）更清楚、改動也更小。

### 2. `inviteMemberByMessage`／`inviteToConversation` 改吃 `targetUserId`，移除文字反查邏輯
- `inviteMemberByMessage(inviteId, targetUserId)`：移除 `findMemberByIdentifier(identifier)` 呼叫，改為 `prisma.user.findUnique({ where: { id: targetUserId } })` 確認帳號仍存在（防「選定後、送出前帳號被刪除」的邊界情況，比照 `addStudentToInvite` 既有寫法），其餘邏輯（自我邀請檢查、既有對話接續/新建、訊息內容組成）不變。
- `inviteToConversation(conversationId, targetUserId)`：移除以 `spiritId` 反查 `prisma.user.findUnique({ where: { spiritId } })` 的邏輯，改直接用 `targetUserId` 查存在性；其餘邏輯（自我邀請檢查、`isParticipant` 冪等判斷、fire-and-forget 通知）不變。
- **副作用（非本次目標，但為改用 `userId` 的自然結果）**：`ConversationMembersDialog` 原本的「從好友清單搜尋」分支會先過濾掉 `!f.spiritId` 的好友（沒有啟動編號者無法被邀請，見原始碼 `invitable = friends.filter((f) => f.spiritId && ...)`）；改用 `userId` 之後這條限制自然消失，任何好友都能被選中邀請。這是行為上的小幅改善，非本次刻意設計目標，但影響範圍已知且正向，在此記錄。

### 3. 兩處 UI 皆改為「按鈕開啟 `StudentPicker`」模式，選定即送出
比照「新增學員」的巢狀 Dialog 模式（外層 Dialog 內有一顆「選擇學員」按鈕，點擊開啟疊加的 `StudentPicker` Dialog）：
- 「使用系統內建訊息邀請」：因為沒有像「新增學員」的「已結業」等額外欄位需要先填寫，選定會員後**直接**呼叫 `inviteMemberByMessage` 送出，不需要像新增學員那樣多一個「確認新增」按鈕的中間狀態。
- 「加入成員」：同理，選定好友／搜尋結果後**直接**呼叫 `inviteToConversation`，與原本「點一位好友即加入」「輸入啟動編號後按送出」的既有行為精神一致（原本好友清單分支本來就是點了就送出；啟動編號分支原本要多按一次送出鈕，改用 `StudentPicker` 後兩種路徑統一為「選定即送出」，屬情理之中的簡化）。

### 4. `myFriends` 於 `course/[id]/page.tsx` 已計算好，直接多傳一份給分享按鈕元件
`page.tsx` 第 154 行 `myFriends`（`canEditInfo && currentUserId ? await getMyFriends(currentUserId) : []`）與 `CopyInviteLinkButton` 的顯示條件（`isInstructor || isAdmin`，即 `canEditInfo`）完全一致，不需要新增查詢或調整條件，只需把既有的 `myFriends` 變數也傳給 `CopyInviteLinkButton` 的新 `friends` prop。

### 5. 刪除整份 `lib/data/invite-students.ts`
`findMemberByIdentifier`／`MemberByIdentifier` 在 `cr-spec-260916-004` 已移除其原本的另一個呼叫端 `lookupMemberByIdentifier`，目前唯一僅存的呼叫端是本次要改掉的 `inviteMemberByMessage`。改完之後這份檔案零引用，直接整份刪除（而非留著一個沒人呼叫的 export），並移除 `app/actions/course-invite.ts` 對它的 import。

## Risks / Trade-offs

- `inviteToConversation` 解除「無啟動編號好友不可邀請」的限制屬正向改善，但若未來有人依賴這條限制做流程管控（目前查無此依賴），需留意；已在本文件記錄以利追溯。
- `searchMembersForCourseInvite` 的 `excludeUserIds` 傳空陣列，代表老師可以對同一位會員重複透過內建訊息邀請多次（`inviteMemberByMessage` 本身允許接續既有對話重複發送邀請文字）；這與原本文字輸入版本行為一致（原本也沒有防重複邀請的機制），非本次引入的新問題。

## Migration Plan

無資料庫 schema 變更。`inviteMemberByMessage`／`inviteToConversation` 的參數型別變更屬 Server Action 簽章變更，因呼叫端（元件）於同一次改動內一併更新，不存在新舊版本並存的相容性問題。
