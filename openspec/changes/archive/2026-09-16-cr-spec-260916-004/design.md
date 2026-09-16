## Context

「課程新增學員」現況（`components/admin/invite-student-cells.tsx` 的 `AddStudentDialog`）：單一文字輸入框，`onChange` debounce 400ms 呼叫 `lookupMemberByIdentifier(inviteId, value)`（`app/actions/invite-students.ts:61`）做**精確**查詢（含 `@` 視為 Email、否則視為啟動編號，`findMemberByIdentifier`，`lib/data/invite-students.ts:27`），查到才顯示確認列並可送出。完全沒有模糊搜尋、也沒有利用「社群好友」（`Friendship` model，`prisma/schema/friendship.prisma:15-29`）。

系統另有兩條相關但用途不同的既有查詢邏輯：
- `lib/data/members.ts` 的 `buildMemberWhere()`：後台會員管理列表用的多欄位模糊搜尋（`realName`／`name`／`nickname`／`email`／`spiritId`，`contains + insensitive`），無好友概念、回傳整頁分頁結果。
- `lib/data/friendship.ts` 的 `getMyFriends()`：取回呼叫者好友清單（`Friendship.ownerId → friendId`），已依「釘選優先→加入時間新到舊」排序，並組好 `searchText` 供前端子字串過濾（`components/conversation/conversation-members-dialog.tsx` 的「從好友加入」模式即用此清單＋前端過濾，非伺服器查詢）。

本次要做的「學員選擇元件」融合以上兩者：伺服器端模糊搜尋＋好友優先排序＋免搜尋直接點好友清單，且明確定位為「通用元件」，故不能直接沿用 `buildMemberWhere`（無好友概念、無課程歸屬授權）或 `conversation-members-dialog` 的作法（僅前端過濾好友、無伺服器搜尋、無法涵蓋非好友的既有會員）。

補充：較早的 `cr-spec-260916-003` 之 `design.md`（分享課程 Dialog）Non-Goals 曾寫「不新增『搜尋/瀏覽會員清單』的通用選人 UI」，當時是刻意收斂範圍、沿用既有輸入框模式；本次為需求方（CR-SPEC-260916-004）明確要求的新範圍，非推翻前次決策，僅是後續獨立需求。

## Goals / Non-Goals

- Goals：
  - 提供可跨功能重用的單選「學員選擇元件」（模糊搜尋＋好友優先＋好友清單直接點選）
  - 套用於「課程新增學員」，取代現行手動輸入完整 Email／啟動編號的方式
  - 保留既有「僅限既有會員」「課程歸屬授權（避免任意講師枚舉會員資料）」等既有安全限制
- Non-Goals：
  - 不支援多選（需求明確「僅提供單一學員選擇回傳」）
  - 不比對通訊 Email（`commEmail`），只比對登入帳號 `email`（與現行 `buildMemberWhere` 一致，使用者已確認範圍）
  - 不在本次順便套用到其他既有選人情境（如「聯繫會員」「教材申請」等），僅先套用於課程新增學員；元件設計上保持可重用，但實際套用範圍以本次需求為準
  - 不新增 i18n key：延續 `components/admin/` 既有做法（後台專屬字串維持繁體中文硬編碼）

## Decisions

### 1. `StudentPicker` 採「展示＋回呼」設計，搜尋邏輯不內建於元件本身

元件本身（`components/shared/student-picker.tsx`）**不直接呼叫任何 Server Action**，而是由呼叫端傳入 `onSearch: (query: string) => Promise<ActionResponse<{ candidates: StudentPickerCandidate[] }>>`。原因：「通用元件」若把搜尋邏輯寫死在元件內，不同情境需要不同的授權範圍與排除清單（例如課程新增學員要依 `inviteId` 做課程歸屬授權＋排除已在該課程的學員；未來若套用到其他情境，排除/授權規則可能完全不同）。把搜尋邏輯交給呼叫端，元件只負責：debounce 觸發、loading/空狀態呈現、清單渲染、點選回傳，維持真正可重用且不繞過各情境既有的存取控管。

`friends: FriendListItem[]` 則由呼叫端直接傳入（呼叫端本來就要能拿到 `getMyFriends()` 結果），元件內部僅對此清單做 `excludeUserIds` 過濾與關鍵字前端子字串過濾（沿用 `conversation-members-dialog.tsx` 現有 pattern：`friend.displayName` 子字串比對），**不**針對好友清單另外發送伺服器請求——好友清單通常不大，且呼叫端已經在頁面載入時整批取回。

### 2. 兩種顯示模式：未輸入關鍵字＝好友清單；已輸入＝伺服器模糊搜尋結果

- **空字串**：直接渲染 `friends`（已排除 `excludeUserIds`），維持 `getMyFriends()` 原本的「釘選優先→加入時間新到舊」排序，不重新排序。這就是需求「社群好友提供清單的方式，可以直接點選」。
- **輸入關鍵字（debounce 300ms）**：呼叫 `onSearch(query)`，結果為「好友優先排序」後的候選清單（伺服器端已排序好，元件不再重排）。
- 兩種模式共用同一個清單渲染區塊（`UserAvatar` ＋ 顯示名稱 ＋ 好友徽章，樣式沿用 `conversation-members-dialog.tsx` 既有清單項寫法），僅資料來源與排序邏輯不同，降低視覺跳動感。

### 3. 新 Data Layer `searchStudentCandidates()` 獨立於 `buildMemberWhere`，不共用/改動後者

新增 `lib/data/student-picker.ts`：
```
searchStudentCandidates(
  currentUserId: string,
  query: string,
  excludeUserIds: string[]
): Promise<StudentPickerCandidate[]>
```
- `where`：`OR: [realName, name, nickname, email].contains(insensitive)` ＋ `spiritId.contains(insensitive)`，與 `buildMemberWhere` 相同四＋一欄位組合（不含 `englishName`、不含 `commEmail`，對齊使用者確認範圍），另加 `id: { notIn: [...excludeUserIds, currentUserId] }`（排除呼叫端指定的清單，並排除自己——操作者不該把自己加為學員）。
- 撈出候選人（`take` 上限 30，含 `avatarKey`／`image`／`realName`／`englishName`／`nickname`／`displayNameMode`／`spiritId`／`email`）後，另查 `prisma.friendship.findMany({ where: { ownerId: currentUserId, friendId: { in: candidateIds } } })` 取得好友 id 集合，標記 `isFriend`。
- 排序：`isFriend` 為 true 的排最前（穩定排序，組內維持查詢原順序），最終回傳前 20 筆（避免清單過長）。
- 不共用 `buildMemberWhere`：後者是後台會員管理專用（分頁、可加 `gender`/`role`/`church` 篩選），語意與授權前提不同（後台頁面本身已是 admin-only 路由），若共用未來後台篩選條件變動會意外影響本元件，故獨立一份精簡版查詢，欄位組合目前相同純屬巧合、非強制同步。

### 4. 課程情境的授權與排除清單放在 Server Action 層，不信任前端

新增 `searchStudentsForInvite(inviteId, query)`（`app/actions/invite-students.ts`，緊鄰既有 `lookupMemberByIdentifier`）：
1. `auth()` + `canManageInvite`（沿用既有函式，管理者或該課建立者）驗證，比照現行 `lookupMemberByIdentifier` 的授權模式，延續既有規格「查詢既有會員之介面（lookup）SHALL 以課程歸屬授權」的限制。
2. 伺服器端查 `prisma.inviteEnrollment.findMany({ where: { inviteId }, select: { userId: true } })` 取得**已在該課程**的學員 id，作為 `excludeUserIds`（不接受前端傳入排除清單，避免被繞過）。
3. 呼叫 `searchStudentCandidates(session.user.id, query, excludeUserIds)`。

`AddStudentDialog` 呼叫 `StudentPicker` 時，`onSearch` 即包一層呼叫此 Server Action；`friends` 則是頁面層級已查好、透過 props 逐層傳入（`page.tsx` → `ApprovedStudentsSection` → `AddStudentDialog` → `StudentPicker`），非在 Dialog 開啟當下才查。

### 5. `addStudentToInvite` 改吃 `userId`，移除 `identifier` 解析與 `lookupMemberByIdentifier`

`StudentPicker` 選定的候選人本身就是查到的既有會員（`userId` 已知、保證存在於查詢當下），不再需要「依格式判斷 Email／啟動編號」再查一次。`addStudentToInvite` 的 zod schema 由 `identifier: z.string()` 改為 `userId: z.string()`（實作採 `z.string().trim().min(1)`，非 `.uuid()`——沿用專案既有 schema 慣例不額外加格式驗證），內部以 `prisma.user.findUnique({ where: { id: userId } })` 取代 `findMemberByIdentifier(identifier)`：
- 找不到（選定後、送出前该帳號恰被刪除的極端邊界情況）：回傳欄位錯誤「所選學員不存在，請重新選擇」，取代原本「查無此會員，請確認 Email 或啟動編號」文案（原文案語意已不符合新流程——使用者不再手動輸入字串）。
- 其餘（重複報名擋下、人數上限、教材選擇預設值、補登結業交易）邏輯完全不變。

`lookupMemberByIdentifier` 因唯一呼叫端（舊輸入框的確認列查詢）被移除而一併刪除（確認全專案零其他引用）。`findMemberByIdentifier`（`lib/data/invite-students.ts`）**保留**：雖然本次移除了其唯一目前呼叫端，但它是通用的「依 Email/啟動編號精確查會員」工具函式，語意獨立、非本次變更範圍的死碼判斷對象，若貿然刪除超出本次「新增學員選人方式」的變更範圍；是否移除留待未來若確認零引用時再另案處理。

### 6. `AddStudentDialog` 內部改為「選定狀態」而非「輸入字串狀態」

原本 `identifier: string` + debounce lookup 的 `useEffect`，改為 `selectedStudent: StudentPickerCandidate | null` state：
- 初始為 `null`，顯示「選擇學員」按鈕（開啟巢狀的 `StudentPicker` Dialog）。
- `StudentPicker` 的 `onSelect` 回呼設定 `selectedStudent` 並關閉 `StudentPicker`；`AddStudentDialog` 主體顯示確認列（精簡樣式，僅「姓名（啟動編號）」，2026-09-16 依使用者要求移除原「將加入既有會員：…，不會變更其帳號資料」前後綴文字）與「重新選擇」連結（清空 `selectedStudent`）。
- 送出按鈕 `disabled` 條件由 `lookup.kind !== 'existing'` 改為 `!selectedStudent`。
- `resetForm()`／`handleOpenChange(false)` 一併清空 `selectedStudent`。

`StudentPicker` 以巢狀 Dialog（`AddStudentDialog` 內開一個子 Dialog）呈現，而非把整個 `AddStudentDialog` 表單塞進 `StudentPicker`：`StudentPicker` 是純選人元件，「已結業補登」等課程情境專屬欄位不屬於它的職責範圍，維持元件邊界單純、方便未來其他情境重用。

### 7. 上線後修正：`AddStudentDialog` 漏傳 `excludeUserIds` 給 `StudentPicker`

初版實作中，`page.tsx` 已算出好友清單（`friends`）但**未算出／未傳遞 `excludeUserIds`**，導致 `AddStudentDialog` 呼叫 `<StudentPicker>` 時完全沒有傳入 `excludeUserIds` prop。結果：`searchStudentsForInvite`（伺服器端）搜尋結果排除正確，但 `StudentPicker` 免搜尋的「好友快速清單」分支因缺少 `excludeUserIds` 而未套用任何排除，已在該課程的好友仍會出現在清單中可被點選（使用者實測發現：已報名學員「Rain」仍出現在好友清單中）。

修正：`page.tsx` 以 `[...courseSession.approvedEnrollments, ...courseSession.pendingEnrollments].map(e => e.user.id)` 算出 `excludeUserIds`（涵蓋 approved 與 pending 兩種狀態，與 `searchStudentsForInvite` 伺服器端排除邏輯範圍一致），逐層透傳 `ApprovedStudentsSection` → `AddStudentDialog` → `StudentPicker`。此為程式碼層級修正，不影響 `searchStudentCandidates`／`searchStudentsForInvite` 既有邏輯（原本即正確）。

## Risks / Trade-offs

- `searchStudentCandidates` 每次搜尋皆重新查詢＋排序（無快取），一般會員規模（預期數百至數千筆）下 `contains + insensitive` 查詢效能無虞；若未來會員規模大幅成長，可再評估加索引或改全文檢索，非本次範圍。
- `StudentPicker` 的好友清單由呼叫端一次性傳入、不分頁；好友數量理論上無上限，若單一使用者好友數極多（數百筆以上）清單渲染與前端過濾效能可能下降，與現行 `conversation-members-dialog.tsx` 的既有已知限制相同，非本次新增風險，暫不處理。
- `addStudentToInvite` 簽章變更（`identifier` → `userId`）為 breaking change，但確認唯一呼叫端已一併修改，無殘留舊呼叫。
- 好友優先排序的「好友」定義為**操作者（管理者／講師）自己的好友清單**，非學員彼此的好友關係；如講師剛好未加該學員為好友，該學員仍會出現在搜尋結果中（僅排序較後），不影響「找得到」，僅影響排序優先度。

## Migration Plan

無資料庫 schema 變更，沿用既有 `User`／`Friendship`／`InviteEnrollment` 資料模型。`addStudentToInvite` 簽章變更為程式碼層級改動，隨部署即時生效，無需資料回填。
