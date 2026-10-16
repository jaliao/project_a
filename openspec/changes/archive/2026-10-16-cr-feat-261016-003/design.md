## Context

`User.id`（UUID）被下列資料表以外鍵引用，合併時需逐一檢視是否會撞到 unique 限制：

| 資料表 | 欄位 | unique 限制 | 處理方式 |
|---|---|---|---|
| `Account`（OAuth） | `userId` | `[provider, providerAccountId]` | **不搬動**（見下方決策） |
| `Notification` | `userId` | 無 | 直接 `updateMany` |
| `PushSubscription` | `userId` | `endpoint`（與 userId 無關） | 直接 `updateMany` |
| `Friendship` | `ownerId`／`friendId` | `[ownerId, friendId]` | 先去重/去自我關係，再 `updateMany` |
| `CourseInvite` | `createdById` | 無 | 直接 `updateMany` |
| `InviteEnrollment` | `userId`／`recommendDeferredById` | `[inviteId, userId]`（僅 `userId` 側） | `userId` 衝突需管理者預先選邊，`recommendDeferredById` 無衝突直接搬動 |
| `CourseMessage` | `authorId` | 無 | **不搬動**（功能已下架，見下方決策） |
| `Conversation` | `createdById` | 無 | 直接 `updateMany` |
| `ConversationParticipant` | `userId` | `[conversationId, userId]` | 先去重，再 `updateMany` |
| `ConversationMessage` | `authorId` | 無 | 直接 `updateMany` |
| `CertificateProduction` | `userId`／`producedById` | `[userId, courseCatalogId]`（僅 userId 側） | 衝突需管理者預先選邊 |
| `LearningRecordFeedback` | `userId`／`resolvedById` | 無 | 直接 `updateMany` |
| `LearningStudyEntry` | `userId` | 無（允許多筆） | 直接 `updateMany` |
| `LearningIntent` | `userId` | `userId` 本身即唯一（每人至多一筆） | 兩邊都有才算衝突，需管理者選邊 |
| `SupportInquiry` | `userId`／`repliedById` | 無（`userId` 為 `SetNull`） | 直接 `updateMany` |
| `AdminActionLog` | `actorId`／`targetUserId` | 無 | **不搬動**（歷史紀錄，見下方決策） |

既有可直接重用的構件：
- `isUndeliverableEmail`（`lib/mailer.ts`）：判斷 email 是否為合成 seed 信箱，CR-002 已用於偵測分級，本次用於預設主/副帳號判定與通知選項的顯示與否。
- `resolveContactEmail`（`lib/utils/contact-email.ts`）：解析通知信收件地址。
- `StudentPicker`（`components/shared/student-picker.tsx`）＋ `searchStudentCandidates`（`lib/data/student-picker.ts`）：`components/admin/member-course-invite-transfer.tsx` 已示範「重用 StudentPicker 元件殼挑選任意會員」的做法（`friends` 傳空陣列、`onSearch` 接自訂查詢），本次直接比照。
- `deleteMember`／`transferCourseInvites`（`app/actions/admin.ts`）：單一交易內完成多表異動＋寫入 `AdminActionLog` 的既有模式，本次沿用。
- `(user)/layout.tsx` 對 `suspendedAt` 的即時阻擋機制（查 DB → `redirect('/api/suspended-logout')` → 清 cookie → 導向獨立頁面）：`mergedIntoId` 直接比照同一套機制，而非只在 `signIn` callback 擋（那只擋得住「新登入」，擋不住「已登入中的舊 session」）。

## Goals / Non-Goals

**Goals:**
- 管理者可在單一交易內把副帳號的關聯資料收斂到主帳號名下。
- 副帳號保留為「已合併」殘影（不刪除），`mergedIntoId`／`mergedAt`／`mergedById` 可供稽核追溯。
- 副帳號合併後無法再登入（新登入與既有 session 皆擋）。
- Unique 衝突（結業證書、上課意願、同班級報名、好友關係、對話參與）在送出前由管理者逐筆解決，交易內不應再撞到預期外的衝突。
- 合併入口同時支援「從會員詳情頁手動挑另一帳號」與「從 CR-002 候選清單直接帶入兩筆」。
- 主帳號缺漏的個人資料欄位（`phone`／教會／`englishName`／`gender`／`birthYear`／`teacherNo`）可從副帳號補齊，避免名冊 seed 匯入的原始資料（通常落在副帳號）在合併後消失（使用者已確認此為必要行為，見本次對話的補值決策）。

**Non-Goals:**
- 不搬動 `Account`（OAuth 綁定）——副帳號本來就要被擋登入，搬過去也用不到，留在原處最簡單、風險最低。
- 不搬動 `CourseMessage.authorId`——課程 FAQ 留言功能已於 CR-SPEC-260828-004 下架，無任何應用層程式讀取此表，搬動它只是徒增交易複雜度，不產生任何可見效益。
- 不搬動 `AdminActionLog.actorId`／`targetUserId`——這是「當時誰做了什麼」的歷史事實，合併後改寫會讓稽核紀錄失真，維持原樣才是正確的稽核語意。
- 不合併 `realName`／`nickname`／`commEmail`——`realName` 在絕大多數合併情境下雙方本就相同（CR-002 候選清單的配對前提就是 `realName` 相同；手動挑選情境若不同，代表管理者應該先確認是否真的是同一人，不該由系統自動覆蓋其中一邊）；`commEmail` 牽涉 `isCommVerified` 驗證狀態的正確性判斷，風險不對等，留給管理者日後自行於會員詳情頁手動設定。`phone`／教會／`englishName`／`gender`／`birthYear`／`teacherNo` 則改為會補值（見上方 Goals），僅在主帳號對應欄位為空時才補，不覆蓋既有值。
- 不支援合併鏈（A 併入 B 後，不可再把 B 併入 C）——`mergeMembers` 會檢查雙方皆未被合併過，避免鏈狀關係難以追溯。
- 不提供「復原合併」功能——合併是刻意設計為單向、不可逆的收斂動作（資料已搬動且可能已發生 unique 去重），復原需要的是人工介入與資料庫層回復，不在本次 UI 範圍內。

## Decisions

- **個人資料欄位採「補空值」規則：主帳號該欄位為空（或 `gender` 為 `unspecified`）且副帳號有值時才補上，主帳號已有值的欄位一律不覆蓋。**
  理由：名冊 seed 匯入的帳號（常見為副帳號）才是真正填過電話／教會等資料的那一筆，使用者自行以 Google 註冊的帳號（常見為主帳號）反而常常什麼都沒填；若完全不處理，這些有價值的既有資料會被凍結在副帳號上形同遺失。只補空值、不覆蓋，確保不會意外抹掉主帳號使用者自己填寫過的資料。涵蓋欄位：`phone`、`churchType`+`churchId`+`churchOther`（視為一組，教會要補就整組一起補，避免 `churchType=church` 但 `churchId=null` 的不一致狀態）、`englishName`、`gender`、`birthYear`、`teacherNo`。預覽畫面列出會補的欄位供管理者確認，不可單獨取消某一欄位的補值（整批套用，保持邏輯單純）。

- **主/副帳號判定：以 `isUndeliverableEmail` 給預設值，雙方皆非合成信箱時強制手動選擇。**
  理由：使用者已確認「合成 seed 信箱優先視為副帳號、使用者自行申請的帳號為主」，這與現有 `isUndeliverableEmail` 判斷邏輯完全吃得上；沒有訊號可判斷時不猜，避免把「兩個真人各自申請的帳號」誤判方向。

- **Unique 衝突一律在預覽階段要求管理者逐筆選邊，交易內不猜規則。**
  理由：結業證書、上課意願、同班級報名這三類衝突都牽涉「哪一筆資料才是正確的」，系統無法用通用規則判斷（例如結業證書的 `producedAt` 兩邊都有值時該留誰），讓管理者肉眼判斷最安全。交易內仍保留防呆（捨棄未被選中的那一側），但正常路徑不應該走到這裡才發現衝突——UI 強制選擇完才能送出。

- **Friendship／ConversationParticipant 的衝突採「自動去重」而非要求管理者選邊，與結業證書/上課意願的「人工選邊」區別對待。**
  理由：好友關係與對話參與者本質上是「關係是否存在」的布林語意，不像結業證書/上課意願有「內容」需要取捨——主帳號已有的關係不需要副帳號那筆重複的，直接保留主帳號既有的那筆、捨棄副帳號重複的那筆即可，不需要額外讓管理者決定「要哪一筆」（兩筆代表的是同一種關係，沒有取捨意義）。自我關係（合併後 `ownerId === friendId`）同理直接捨棄。

- **`InviteEnrollment` 衝突（雙方在同一班級都有報名記錄）要求管理者選邊，理由與結業證書相同。**
  理由：報名記錄含 `status`／`graduatedAt`／`materialChoice` 等內容性欄位，不是單純的關係存在與否，需要管理者判斷保留哪一筆。

- **副帳號標記用新欄位（`mergedIntoId`/`mergedAt`/`mergedById`），不重用 `suspendedAt`/`suspendReason`。**
  理由：「已暫停」與「已合併」是語意不同的兩種狀態（暫停是帳號本身出問題、合併是帳號已不是這個人的入口），混用會讓後台統計與訊息文案都要額外判斷是哪種情況，新欄位更清楚也更好稽核（可直接查 `mergedIntoId` 反查是誰的副帳號）。

- **登入阻擋沿用 `suspendedAt` 的兩層機制（`signIn` callback ＋ `(user)/layout.tsx`），不是只加一層。**
  理由：`signIn` callback 只在「新登入」時執行，無法踢掉已經登入的舊 session；`(user)/layout.tsx` 每次請求都查 DB，才能做到「合併後既有 session 立即失效」，這正是 `suspendedAt` 現有機制要解決的同一個問題，直接比照。

- **合併動作不限制 `enableDelete`（`ENABLE_MEMBER_DELETE`）環境變數。**
  理由：該環境變數是為「硬刪除會員」這個真正不可逆、無殘影的危險動作設的開關；合併保留殘影記錄、風險層級不同，不應該被同一個開關誤擋。

- **合併入口放在會員詳情頁「特殊設定」分頁的既有區塊旁（非危險操作框內），另開一個「帳號管理」框。**
  理由：合併不是「刪除」那種硬刪除語意，用同一個 `border-destructive` 危險操作框會誤導管理者高估風險；但仍需要醒目呈現，獨立一個框即可。

- **CR-002 候選清單的「合併」連結只做導覽/預開對話框，清單頁本身仍不執行任何寫入。**
  理由：維持 CR-002 原本「純查看」的定位不變——連結只是帶著兩個 `userId` 打開本 CR 新增的合併對話框，實際的預覽查詢與送出動作都在對話框內觸發新的 Server Action，清單頁的 server component 本身沒有任何變化。

- **合併通知信與 Phase 1 的偵測邏輯一樣重用 `isUndeliverableEmail`，不另外判斷。**
  理由：維持單一事實來源，避免兩處各自判斷「這是不是合成信箱」而產生不一致。

## Risks / Trade-offs

- [管理者在預覽階段看到的衝突筆數與送出時可能不一致（例如預覽後、送出前副帳號又新增了一筆報名）] → `mergeMembers` 在交易內重新查詢一次所有會搬動的資料與衝突，若發現與預覽時不同（例如出現新的未解決衝突），直接拒絕整個交易並提示「資料已變動，請重新預覽」，不猜測處理，比照 `addStudentToInvite`／`submitRecoveryEmail` 等既有「送出前重新查詢防呆」慣例。
- [合併是不可逆動作，一旦執行錯誤的主/副帳號方向，資料很難手動復原] → 預覽畫面必須清楚標示「主帳號（保留，可登入）」與「副帳號（將被標記合併，無法登入）」，且兩者的顯示名稱、Email、啟動編號皆完整呈現，降低選錯方向的機率；本次不做「復原合併」功能（見 Non-Goals），但有 `AdminActionLog` 稽核紀錄可供事後人工查核與資料庫層補救。
- [副帳號的 `/user/[spiritId]/...` 公開頁面合併後內容會變空（資料都搬走了）] → 本次不處理（proposal 討論時列為 nice-to-have），使用者可視情況另開 CR 補一個導向主帳號的提示 banner。
- [`CourseMessage` 功能已下架但資料表仍存在，若未來該表被重新啟用，副帳號的歷史留言會「消失」在搜尋範圍外] → 已下架功能目前無任何讀取路徑，風險極低；若未來重新啟用該功能，屆時再評估是否需要補一次性資料修正，不在本次處理。

## Migration Plan

1. `prisma/schema/user.prisma` 新增欄位與自關聯（`mergedIntoId`／`mergedAt`／`mergedById`，皆為 optional，`onDelete: SetNull`），跑 `make schema-update name=member_merge` 產生 migration。屬加欄位的非破壞性變更，正式環境既有資料不受影響（全部為 null）。
2. 新增程式碼（Server Actions、元件、頁面、寄信函式、路由註冊、i18n key、操作手冊）為純新增，不影響既有功能。
3. 回退：若需下架本功能，移除新增的按鈕/連結/路由即可；已標記 `mergedIntoId` 的帳號仍會被登入阻擋邏輯擋下（除非同時回退 `lib/auth.ts`／`(user)/layout.tsx` 的檢查），回退前應先評估是否要保留「已合併帳號不可登入」這個效果。

## Open Questions

（無）
