## Why

`cr-spec-260916-004` 已把課程頁「新增學員」的 Email／啟動編號文字輸入，改成通用的「學員選擇元件」`StudentPicker`（模糊搜尋啟動編號／姓名／暱稱／Email，或直接自社群好友清單點選）。目前系統裡還有另外兩處「選一位既有會員」的介面，仍各自維護一套獨立、較陽春的輸入邏輯：

1. 課程詳情頁「分享課程」對話視窗的「使用系統內建訊息邀請」——目前是一個純文字 Input（輸入 Email 或啟動編號）。
2. 社群「訊息」頁籤對話成員彈窗的「加入成員」——目前是「從好友清單搜尋」與「輸入啟動編號」兩顆切換鈕＋各自的輸入框。

這兩處的操作體驗與新版「新增學員」不一致（沒有好友清單快速點選、沒有模糊搜尋），且各自維護重複邏輯。經調查確認 `StudentPicker` 元件本身與其資料層 `searchStudentCandidates` 已是完全通用設計（不綁定課程情境，排除清單與搜尋邏輯皆由呼叫端注入），可直接複用，不需修改元件本身。

## What Changes

- 課程詳情頁「分享課程」對話視窗的「使用系統內建訊息邀請」區塊，移除原本的 Email／啟動編號文字 Input，改為一顆「選擇會員」按鈕開啟 `StudentPicker`；選定會員後直接呼叫 `inviteMemberByMessage` 送出邀請訊息（免除文字輸入與模糊比對的失敗可能）。
- 新增 Server Action `searchMembersForCourseInvite(inviteId, query)`（`app/actions/course-invite.ts`）：比照既有 `searchStudentsForInvite` 的授權寫法（該課講師或管理者），包裝既有 `searchStudentCandidates` 供 `StudentPicker` 的 `onSearch` 使用。
- `inviteMemberByMessage` 參數由 `identifier: string`（Email／啟動編號文字）改為 `targetUserId: string`（`StudentPicker` 選定結果的 `userId`），移除内部的 `findMemberByIdentifier` 模糊查詢，改為直接以 `userId` 查會員是否存在。
- 社群「訊息」頁籤對話成員彈窗（`ConversationMembersDialog`）的「加入成員」，移除「從好友清單搜尋／輸入啟動編號」切換鈕與各自的輸入框及內部過濾邏輯，改為同一顆「選擇會員」按鈕開啟 `StudentPicker`（`excludeUserIds` 傳入目前對話參與者，排除已在對話中的成員），選定後直接呼叫 `inviteToConversation` 加入對話。
- 新增 Server Action `searchMembersForConversation(conversationId, query)`（`app/actions/conversation.ts`）：驗證操作者為該對話參與者，`excludeUserIds` 以伺服器端重新查詢的參與者名單為準（不信任前端傳入），包裝 `searchStudentCandidates`。
- `inviteToConversation` 參數由 `targetSpiritId: string` 改為 `targetUserId: string`，移除以 `spiritId` 反查會員的邏輯；副作用：原本「沒有啟動編號的好友無法被邀請」的限制隨之解除（純屬改善，非刻意設計目標）。
- 清除因本次改動而變成零引用的死碼：`lib/data/invite-students.ts`（`findMemberByIdentifier`／`MemberByIdentifier`，其唯一呼叫端 `inviteMemberByMessage` 已改用 `userId`，`lookupMemberByIdentifier` 已於 `cr-spec-260916-004` 移除，整份檔案無其他用途，直接刪除整個檔案）。

## Capabilities

### Modified Capabilities
- `course-session-detail`：「講師專屬：課程分享」需求的「使用系統內建訊息邀請」管道改為透過 `StudentPicker` 選定會員
- `contact-member`：「邀請加入對話」需求改為透過 `StudentPicker` 選定會員，取代原本「輸入啟動編號／從好友清單搜尋」兩種切換方式

## Impact

- **元件**：`StudentPicker`（`components/shared/student-picker.tsx`）與資料層 `searchStudentCandidates`（`lib/data/student-picker.ts`）**不需修改**，本次純粹是新增兩個呼叫端使用場景。
- **元件變更**：`app/[locale]/(user)/course/[id]/copy-invite-link-button.tsx`（新增 `friends` prop，內建訊息邀請區塊改用 `StudentPicker`）；`components/conversation/conversation-members-dialog.tsx`（移除切換鈕與雙輸入邏輯，改用 `StudentPicker`）。
- **頁面**：`app/[locale]/(user)/course/[id]/page.tsx` 把既有的 `myFriends`（已於同一 `canEditInfo` 條件下算好，目前只傳給新增學員元件）一併傳給 `CopyInviteLinkButton`。
- **Server Actions**：`app/actions/course-invite.ts` 新增 `searchMembersForCourseInvite`、修改 `inviteMemberByMessage` 參數；`app/actions/conversation.ts` 新增 `searchMembersForConversation`、修改 `inviteToConversation` 參數。
- **刪除檔案**：`lib/data/invite-students.ts`（整份檔案零引用）。
- **i18n**：`messages/zh-TW.json`／`en.json` 的 `course.copyLink` 移除 `identifierPlaceholder`／`sendInvite`（不再需要），新增 `selectMember` 按鈕文案；`conversation` 命名空間移除 `addByFriend`／`addBySpiritId`／`friendSearchPlaceholder`／`noFriendsToAdd`／`noFriendMatch`／`invitePlaceholder`（切換鈕與雙輸入 UI 一併移除，改沿用同一個新增的 `selectMember` 或另立 `conversation.selectMember` 文案），`npm run gen:zh-cn` 重新產生 `zh-CN`。
- 不影響 Prisma schema／migration；不改變 `inviteMemberByMessage`／`inviteToConversation` 的核心行為（發送對象、通知內容、冪等/權限規則皆不變），僅改變「如何選定對象」的輸入方式與參數型別。
