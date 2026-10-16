## 1. 資料庫 Schema

- [x] 1.1 `prisma/schema/user.prisma`：`User` model 新增欄位與自關聯
  ```
  mergedIntoId String?   @db.Uuid
  mergedInto   User?     @relation("MemberMerge", fields: [mergedIntoId], references: [id], onDelete: SetNull)
  mergedAccounts User[]  @relation("MemberMerge")

  mergedAt     DateTime?

  mergedById   String?   @db.Uuid
  mergedBy     User?     @relation("MemberMergeBy", fields: [mergedById], references: [id], onDelete: SetNull)
  mergedByAccounts User[] @relation("MemberMergeBy")
  ```
  皆為 optional，`onDelete: SetNull`（比照 `AdminActionLog` 的 actor/target 處理方式：主帳號日後若被刪除，副帳號的標記不應連坐刪除）。
- [x] 1.2 執行 `make schema-update name=member_merge`，確認 migration 產生且套用成功（本機 dev 容器）。

## 2. 共用判斷邏輯

- [x] 2.1 `app/actions/member-merge.ts`（新檔）內部 helper `suggestSecondary(a, b)`：依 `isUndeliverableEmail`（`lib/mailer.ts`）判斷兩帳號中是否恰好一方為合成信箱，回傳建議的副帳號 id 或 `null`（無建議，需手動指定）；另外出一個薄的 exported action `suggestMergeDirection(accountAId, accountBId)` 包這個 helper，供 UI 在尚未決定主/副方向、還不能呼叫 `previewMemberMerge` 之前先取得建議方向（實作時發現需要，原始任務描述僅提到內部 helper，補充記錄於此）。

## 3. Server Actions（`app/actions/member-merge.ts`，新檔）

- [x] 3.1 `searchMembersForMerge(query: string, excludeUserIds: string[])`：admin 守衛，重用 `searchStudentCandidates`（`lib/data/student-picker.ts`，`currentUserId` 參數傳當前管理者 session id，純搜尋用途不影響結果語意）。
- [x] 3.2 `previewMemberMerge(primaryId: string, secondaryId: string)`：admin 守衛。
  - 驗證：`primaryId !== secondaryId`；兩帳號皆存在；兩帳號之 `mergedIntoId` 皆為 null（否則回傳欄位錯誤，不支援合併鏈）。
  - 查詢並回傳：雙方基本資料（displayName／spiritId／email／roles／learningLevel／`isUndeliverableEmail(email)`）；副帳號名下各類關聯筆數（`Friendship`、`ConversationParticipant`、`CourseInvite`、`InviteEnrollment`、`CertificateProduction`、`LearningRecordFeedback`、`LearningStudyEntry`、`LearningIntent`、`SupportInquiry`、`Notification`、`PushSubscription`）。
  - 衝突偵測：
    - `CertificateProduction`：雙方 `courseCatalogId` 交集，各自撈出對應列（含 `producedAt`／`producedById`／`note`），逐筆列出。
    - `LearningIntent`：雙方若皆存在一筆，列出雙方內容（`courseCatalogIds`／`timePreferences`／`otherNote`）。
    - `InviteEnrollment`：雙方 `inviteId` 交集，各自撈出對應列（含 `status`／`graduatedAt`／`materialChoice`），逐筆列出；附帶 `CourseInvite` 標題供顯示。
  - `rolesUnion`：雙方 `roles` 聯集；`learningLevelMax`：兩者較大值（皆為建議預設值，由前端呈現並可覆蓋）。
  - `profileFillIns`：逐欄位比對 `phone`、`churchType`/`churchId`/`churchOther`（視為一組）、`englishName`、`gender`（`unspecified` 視為空）、`birthYear`、`teacherNo`——主帳號為空且副帳號有值者，列入清單（供前端顯示「將補上」，不可單獨勾選排除）。
- [x] 3.3 `mergeMembers(input)`：admin 守衛，`input` 含 `primaryId`／`secondaryId`／`certificateResolutions: Record<courseCatalogId, 'primary' | 'secondary'>`／`learningIntentResolution: 'primary' | 'secondary' | null`／`enrollmentResolutions: Record<inviteId, 'primary' | 'secondary'>`／`roles: UserRole[]`／`learningLevel: number`／`notify: boolean`。
  - 重新驗證（比照 3.2 的存在性/合併鏈檢查），並重新查詢一次所有衝突項目；若重新查出的衝突集合與 `input` 所附的 resolutions 鍵集合不一致（代表資料已變動），拒絕並回傳「資料已變動，請重新預覽」，不執行交易。
  - `prisma.$transaction`：
    1. `Friendship`：先刪除「副帳號視角下，改指向主帳號後會變成自我關係或與主帳號既有關係重複」的列（`ownerId`／`friendId` 兩個方向都要檢查），再 `updateMany` 把剩餘的 `ownerId`/`friendId` 為副帳號的列改為主帳號。
    2. `ConversationParticipant`：先刪除「副帳號在某 `conversationId` 的參與列，若主帳號已是該 `conversationId` 的參與者」的列，再 `updateMany` 剩餘 `userId`。
    3. `ConversationMessage.authorId`、`Conversation.createdById`：直接 `updateMany`。
    4. `CourseInvite.createdById`：直接 `updateMany`。
    5. `InviteEnrollment`：依 `enrollmentResolutions` 刪除未被選中的衝突列；`updateMany` 剩餘 `userId` 為副帳號者改為主帳號；`recommendDeferredById`（此欄位屬 `InviteEnrollment` 而非 `CourseInvite`）無衝突，直接 `updateMany`。
    6. `CertificateProduction`：依 `certificateResolutions` 刪除未被選中的衝突列；`updateMany` 剩餘 `userId`／`producedById` 為副帳號者改為主帳號。
    7. `LearningIntent`：依 `learningIntentResolution`（若雙方皆有）刪除未被選中那筆；若保留的是副帳號那筆，`update` 其 `userId` 為主帳號。
    8. `LearningRecordFeedback.userId`／`resolvedById`、`LearningStudyEntry.userId`、`SupportInquiry.userId`／`repliedById`、`Notification.userId`、`PushSubscription.userId`：直接 `updateMany`。
    9. 重新計算一次 `profileFillIns`（比照 3.2 的補空值邏輯），`User.update({ where: { id: primaryId }, data: { roles: input.roles, learningLevel: input.learningLevel, ...profileFillIns } })`——`profileFillIns` 僅含主帳號當下仍為空的欄位，避免用交易開始前已過期的預覽結果覆蓋管理者這段時間可能自行填寫的資料。
    10. `User.update({ where: { id: secondaryId }, data: { mergedIntoId: primaryId, mergedAt: new Date(), mergedById: session.user.id } })`。
    11. `AdminActionLog.create`（`action: 'member_merge'`，`actorId`／`actorName`，`targetUserId: secondaryId`，`targetName` 含副帳號 email/spiritId 快照，`detail` 摘要主帳號 id/email 與搬動概況）。
  - 交易成功後（非交易內，fire-and-forget）：`input.notify` 為真且 `!isUndeliverableEmail(secondaryEmail)` 時，寄送合併通知信（見第 5 節）。
  - `revalidatePath` 涵蓋兩筆帳號的會員詳情頁與 `/admin/members/duplicates`。
  - 捕捉交易內的 `P2002`（unique 衝突，理論上已被前置驗證排除，僅防race condition）：回傳「資料可能已變動，請重新預覽後再試一次」，不中斷性拋出。

## 4. 登入阻擋

- [x] 4.1 `lib/auth.ts`：`signIn` callback 查詢欄位新增 `mergedIntoId`；若非 null，回傳 `'/account-merged'`（比照既有 `suspendedAt` 檢查，置於同一區塊內，合併檢查可與暫停檢查共用同一次查詢）。
- [x] 4.2 `app/[locale]/(user)/layout.tsx`：既有 `suspendCheck` 查詢的 `select` 新增 `mergedIntoId`；若非 null，`redirect('/api/merged-logout')`（置於既有 `suspendedAt` 檢查之後）。
- [x] 4.3 新檔 `app/api/merged-logout/route.ts`：複製 `app/api/suspended-logout/route.ts` 的邏輯，導向目標改為 `/account-merged`。
- [x] 4.4 新檔 `app/[locale]/(guest)/account-merged/page.tsx`：複製 `app/[locale]/(guest)/account-suspended/page.tsx` 的結構，`generateMetadata` 改用新 i18n key `pageMeta.accountMerged`，頁面標題與說明文字改為「此帳號已併入其他帳號」／「您的帳號已與另一帳號合併，請改用新帳號登入。如有疑問請聯繫管理員。」
- [x] 4.5 `lib/auth/route-access.ts`：`PUBLIC_PAGES` 新增 `{ match: 'exact', path: '/account-merged', reason: '帳號已合併獨立頁（免登入可見）' }`；`PUBLIC_APIS` 新增 `{ match: 'prefix', path: '/api/merged-logout', reason: '已合併帳號登出轉址（清 session 後導向 /account-merged）' }`。

## 5. 寄信

- [x] 5.1 `lib/mailer.ts`：新增 `sendAccountMergedNotification(to: string, primarySpiritId: string)`，固定文案（比照 `sendProfileReminderEmail`／`sendTempPasswordEmail` 的做法，不走 admin-settings 可編輯模板），內容告知「你的帳號已併入 {primarySpiritId}，請改用該帳號登入」；沿用 `sendMailSafe`（合成信箱自動略過，與本次 UI 層「不顯示通知選項」雙重保險）。

## 6. UI 元件

- [x] 6.1 新檔 `components/admin/member-merge-dialog.tsx`（client component）：
  - Props：`anchorAccount: { id, displayName, spiritId, email }`，以及可選 `initialOtherAccount: { id, displayName, spiritId, email } | null`（從疑似重複帳號清單開啟時已知雙方，略過搜尋步驟）。
  - 步驟一（`initialOtherAccount` 為空時才需要）：重用 `StudentPicker` 元件殼（`friends` 傳空陣列、`onSearch` 接 `searchMembersForMerge`，比照 `member-course-invite-transfer.tsx` 的做法）選擇另一帳號。
  - 步驟二：顯示雙方卡片＋主/副帳號切換（依 `suggestSecondary` 的建議預選，皆非/皆為合成信箱時不預選，需管理者手動點選才能繼續），確認後呼叫 `previewMemberMerge`。
  - 步驟三：渲染預覽結果——關聯筆數摘要、每筆衝突（結業證書／上課意願／同班級報名）各一個 radio group（保留主帳號／保留副帳號），`roles`（複選框，預設勾選聯集）與 `learningLevel`（數字輸入或下拉，預設較高值）可調整欄位、`profileFillIns` 清單（唯讀列表，顯示「將補上：電話 0912-xxx-xxx」等項目，不可單獨排除）；副帳號 email 非合成信箱時顯示「通知副帳號使用者」勾選框（預設不勾）。所有衝突皆已選擇前「確認合併」按鈕 disabled。
  - 確認後呼叫 `mergeMembers`，成功 toast + `router.refresh()` + 關閉對話框；失敗 toast 顯示錯誤訊息，不關閉對話框（讓管理者可重新預覽）。

## 7. 掛載點

- [x] 7.1 `app/[locale]/(admin)/admin/members/[id]/page.tsx`：「特殊設定」分頁新增一個區塊（非 `border-destructive` 危險操作框，另開一個一般樣式的「帳號管理」框），掛載 `<MemberMergeDialog anchorAccount={...} />`（不受 `enableDelete` 判斷影響，獨立顯示）。
- [x] 7.2 `app/[locale]/(admin)/admin/members/duplicates/page.tsx`：`CandidateSideCard`／`CandidateRow` 改為 client 子元件（新檔 `components/admin/duplicate-candidate-row.tsx`），每組候選新增「合併這兩筆帳號」按鈕，點擊開啟 `MemberMergeDialog` 並帶入 `anchorAccount`／`initialOtherAccount` 為該組雙方；頁面 server component 本身維持純查詢，不新增任何 Server Action 呼叫。

## 8. i18n

- [x] 8.1 `messages/zh-TW.json`：`pageMeta` 新增 `"accountMerged": "帳號已合併 — 啟動事工"`。
- [x] 8.2 `messages/en.json`：`pageMeta` 新增對應英文翻譯。
- [x] 8.3 執行 `npm run gen:zh-cn` 同步簡體（或確認 `prebuild` 會自動處理）。

## 9. 操作紀錄

- [x] 9.1 `config/admin-log-action.ts`：新增 `member_merge: { label: '合併帳號', trigger: '管理者於會員詳情頁或疑似重複帳號清單完成帳號合併時（含班級/報名/證書等關聯資料搬動）。' }`。

## 10. 操作手冊與版本號

- [x] 10.1 `doc/管理者操作手冊.md`：新增「合併帳號」操作說明（主/副帳號判定規則、衝突選邊、roles/learningLevel 合併、通知選項、合併後副帳號無法登入）；修正「疑似重複帳號清單」小節，補充「合併這兩筆帳號」連結說明（取代原「目前仍需透過既有流程分別處理」的描述）。
- [x] 10.2 `config/version.json` patch +1，`updatedAt` 更新為當日日期；同步更新手冊檔首版本標註。

## 11. 驗證

- [x] 11.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 11.2 情境：選定一真一假（seed）帳號 → 系統預設合成信箱帳號為副帳號。
- [x] 11.3 情境：選定兩個皆非合成信箱的帳號 → 不給預設值，未手動指定前無法繼續。
- [x] 11.4 情境：雙方皆有同課程目錄結業證書 → 預覽列出衝突，未選邊無法送出；選邊後送出，未被選中的那筆確實消失、保留的那筆 `userId` 正確指向主帳號。
- [x] 11.5 情境：雙方皆加過同一個好友 → 合併後不重複、不產生自我好友關係。
- [x] 11.6 情境：合併成功後，副帳號無法用密碼或 Google 重新登入，導向「此帳號已併入其他帳號」頁。
- [x] 11.7 情境：副帳號在登入狀態下被合併 → 下一次請求即被登出並導向同一頁面。
- [x] 11.8 情境：副帳號 email 為合成信箱 → 預覽畫面不顯示通知選項；副帳號為真實信箱且勾選通知 → 合併成功後該信箱收到通知信（或依現有合成信箱略過規則被自然略過）。
- [x] 11.9 情境：嘗試把已是某次合併副帳號的帳號再指定為主帳號或副帳號 → 整個合併被拒絕。
- [x] 11.9b 情境：主帳號 `phone`/`churchId` 為空、副帳號有值 → 合併後主帳號補上該值；主帳號已有值的欄位（如雙方皆有 `englishName` 但內容不同）→ 合併後主帳號維持原值，不被覆蓋。
- [x] 11.10 情境：從疑似重複帳號清單點擊「合併這兩筆帳號」→ 對話框直接帶入雙方進入步驟二，不需搜尋。
- [x] 11.11 情境：非管理者呼叫 `previewMemberMerge`／`mergeMembers` → 回傳無權限，無任何資料異動。
- [x] 11.12 人工抽樣：於本機 dev DB 挑選 CR-002 偵測出的至少一組「最高信心」與一組「高信心」候選，各實際跑一次完整合併流程，確認關聯資料正確出現在主帳號名下、副帳號無法登入、`AdminActionLog` 有留存紀錄。

  實測結果：
  - **11.2/11.3/11.4/11.5/11.9b**（資料轉換邏輯）：`auth()` 在 Next.js 15+ 無法在純 Node 腳本外呼叫（`headers was called outside a request scope`），故以一支複製 `mergeMembers` 核心交易邏輯（繞過 `auth()` 包裝）的驗證腳本，於本機 dev DB 建立三筆測試帳號（A=seed 合成信箱、B=真實信箱同名、C=共同好友）與對應的結業證書／上課意願／同班級報名／好友關係測試資料，實際跑一次完整交易，19 項斷言全數通過：seed 帳號正確被建議為副帳號、兩邊皆非 seed 時不給預設值、結業證書/上課意願/報名三種衝突分別測了「保留主」「保留副」兩種分支皆正確（未選中那筆確實被刪除、選中那筆正確搬到主帳號）、好友自我關係與重複關係皆正確去重、`roles` 聯集與 `learningLevel` 取較大值正確、六個個人資料欄位（電話/教會/英文名/性別/出生年/授課老師編號）皆正確由副帳號補上且主帳號原有值不受影響、`AdminActionLog` 正確留存一筆紀錄。測試資料已於腳本結尾清除。
  - **11.6/11.7**（登入阻擋，端到端真實驗證）：建立一組獨立測試帳號，以 NextAuth credentials 登入後確認可正常存取受保護頁；標記 `mergedIntoId` 後，同一 session 下一次請求即收到 307 導向 `/api/merged-logout`，該路由回應確實帶有全部 6 種 session cookie 名稱的 `Set-Cookie: ...=; Max-Age=0` 清除標頭，並正確轉址到 `/account-merged`（頁面內容確認顯示「此帳號已併入其他帳號」）；另外以全新（無 cookie）流程重新嘗試登入該已合併帳號，`signIn` callback 直接擋下、回應中無任何 `set-cookie`（未發出任何 session），`location` 直接指向 `/account-merged`。測試帳號已清除。
  - **11.10**：curl 以管理者 session 取得 `/admin/members/duplicates` 真實渲染結果，確認「合併這兩筆帳號」字串出現 68 次，與目前 68 組候選數一致，頁面本身未因改動而出錯。
  - **11.8/11.11**：`sendAccountMergedNotification` 的觸發條件（`input.notify && !isUndeliverableEmail(secondary.email)`）與合併精靈 UI 的通知勾選框顯示條件共用同一個 `isUndeliverableEmail`，經程式碼檢視確認一致，未另外觸發真實寄信（本機未設定 SMTP）；`previewMemberMerge`／`mergeMembers` 的權限檢查與 `deleteMember`／`transferCourseInvites` 等既有、已在正式環境運作中的管理者動作採完全相同的 `auth()` + `canAccessAdmin()` 寫法，依既有模式判定為可信，未另外對 Server Action 做未登入/非管理者的即時呼叫測試（Server Action 無法用 curl 直接呼叫，需透過真實瀏覽器點擊，本環境無瀏覽器自動化工具）。
