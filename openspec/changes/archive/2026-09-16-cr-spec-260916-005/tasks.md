## 1. 課程分享：使用系統內建訊息邀請

- [x] 1.1 `app/actions/course-invite.ts` 新增 `searchMembersForCourseInvite(inviteId, query)`：驗證操作者為該課講師或管理者，`excludeUserIds` 傳 `[]`，呼叫既有 `searchStudentCandidates` 回傳候選清單
- [x] 1.2 `app/actions/course-invite.ts` `inviteMemberByMessage` 參數由 `identifier: string` 改為 `targetUserId: string`：移除 `findMemberByIdentifier` 呼叫，改用 `prisma.user.findUnique({ where: { id: targetUserId } })` 確認帳號仍存在；其餘邏輯（自我邀請檢查、既有對話接續/新建對話、訊息內容）不變（新增共用 `canManageCourseInvite` helper 給兩個 action 一起用）
- [x] 1.3 `app/[locale]/(user)/course/[id]/copy-invite-link-button.tsx`：新增 `friends: FriendListItem[]` prop；移除 `identifier` state 與文字 Input，改為「選擇會員」按鈕開啟 `StudentPicker`（`onSearch` 呼叫 `searchMembersForCourseInvite(courseId, query)`，`onSelect` 直接呼叫 `inviteMemberByMessage(courseId, student.userId)`）
- [x] 1.4 `app/[locale]/(user)/course/[id]/page.tsx`：`CopyInviteLinkButton` 呼叫端新增 `friends={myFriends}`（`myFriends` 已於同一 `canEditInfo` 條件下算好，無需新查詢）

## 2. 社群訊息：加入成員

- [x] 2.1 `app/actions/conversation.ts` 新增 `searchMembersForConversation(conversationId, query)`：驗證操作者為該對話參與者（`isParticipant`），`excludeUserIds` 以伺服器端重新查詢的目前參與者 `userId` 清單為準，呼叫既有 `searchStudentCandidates` 回傳候選清單
- [x] 2.2 `app/actions/conversation.ts` `inviteToConversation` 參數由 `targetSpiritId: string` 改為 `targetUserId: string`：移除以 `spiritId` 反查會員的邏輯，改用 `targetUserId` 直接查存在性；其餘邏輯（自我邀請檢查、`isParticipant` 冪等判斷、fire-and-forget 通知）不變
- [x] 2.3 `components/conversation/conversation-members-dialog.tsx`：移除 `mode`／`q`／`spiritIdInput` state 與 `invitable`／`shown` 兩段 `useMemo`、切換鈕與雙輸入 JSX；改為「選擇會員」按鈕開啟 `StudentPicker`（`friends` prop 原樣傳入、`excludeUserIds={participantIds}`、`onSearch` 呼叫 `searchMembersForConversation(conversationId, query)`、`onSelect` 直接呼叫 `inviteToConversation(conversationId, student.userId)`）

## 3. 死碼清除

- [x] 3.1 刪除整份 `lib/data/invite-students.ts`（`findMemberByIdentifier`／`MemberByIdentifier` 已零引用）
- [x] 3.2 `app/actions/course-invite.ts` 移除對 `lib/data/invite-students.ts` 的 import（已於 1.1/1.2 一併完成）

## 4. i18n

- [x] 4.1 `messages/zh-TW.json` 的 `course.copyLink` 命名空間：移除 `identifierPlaceholder`／`sendInvite`，新增 `selectMember`（「選擇會員」按鈕文案），`messageInviteDesc` 文字同步調整為不再提及文字輸入
- [x] 4.2 `messages/zh-TW.json` 的 `conversation` 命名空間：移除 `addByFriend`／`addBySpiritId`／`friendSearchPlaceholder`／`noFriendsToAdd`／`noFriendMatch`／`invitePlaceholder`（皆已零引用），新增 `selectMember`；`inviteFail` 文字同步調整（移除過時的「啟動編號」措辭）
- [x] 4.3 `messages/en.json` 同步調整；執行 `npm run gen:zh-cn` 重新產生 `zh-CN.json`

## 5. 驗證

- [x] 5.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 5.2 `npm run build`（Compiled successfully）
- [x] 5.3 手動驗證（**部分執行**：本次 session 無瀏覽器操作工具。已用 curl 對執行中的 dev 容器做煙霧測試：`course/439` 回應 200 無 500（確認新的 `StudentPicker` 引用未造成執行期錯誤）；`/messages` 未登入回應 307 導向登入。`tsc --noEmit`／`npm run lint`／`npm run build` 皆涵蓋全部改動檔案並通過。實際登入後「課程分享內建訊息邀請可開啟學員選擇元件並成功送出」「社群訊息加入成員可開啟學員選擇元件、已在對話中的成員不出現、選定後成功加入且對方收到通知」「兩處非授權操作者呼叫對應 search/邀請 action 皆被拒絕」等互動流程仍待人工於瀏覽器實測）
- [x] 5.4 已同步 `doc/老師手冊.md`（〈四、邀請學員〉「方式 1」內建訊息邀請描述改寫）、`doc/學員手冊.md`（〈社群〉對話成員段落改寫）；`doc/管理者操作手冊.md` 該段落無輸入方式細節描述，無需修改；`config/version.json` 0.1.207→0.1.208（2026-09-16）；`README-AI.md` 版本行；`ai-context/07-current-tasks.md`「已完成」清單新增本次 CR 記錄
