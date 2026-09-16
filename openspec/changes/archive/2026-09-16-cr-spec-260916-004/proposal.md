## Why

「課程 → 新增學員」目前只能靠管理者／講師手動輸入**完整** Email 或啟動編號（`components/admin/invite-student-cells.tsx` 的 `AddStudentDialog`），輸入錯誤（漏字、大小寫、啟動編號打錯）就查無結果，也無法先瀏覽/搜尋一輪再挑人，體驗生硬。同時系統已有「社群好友」（`Friendship`）功能，講師與管理者本身多半就是某些學員的好友，卻完全沒有被利用——加好友的學員應該能直接點選帶入，不必再手動輸入完整帳號。

需求方（CR-SPEC-260916-004）希望做一個**通用**的「學員選擇元件」：以編號／姓名／暱稱／Email 模糊搜尋既有會員，已加好友者優先顯示，社群好友也能不打字直接以清單點選；元件僅回傳單一學員，先套用在「課程 新增學員」取代現行輸入框。

## What Changes

- 新增通用元件 `StudentPicker`（`components/shared/student-picker.tsx`）：
  - 未輸入關鍵字時，顯示呼叫端傳入的社群好友清單（`FriendListItem[]`），可直接點選任一好友完成選取，不需打字。
  - 輸入關鍵字（編號／姓名／暱稱／Email，皆模糊比對、debounce）後，改為呼叫端傳入的搜尋函式查既有會員，結果中**已加好友者排在最前面**。
  - 單選：點選任一候選人即回傳該筆資料並關閉元件，不支援多選。
  - 純展示＋回呼設計（搜尋邏輯由呼叫端各自提供 `onSearch`），讓不同情境可套用各自的資料範圍／授權檢查，維持「通用」但不繞過既有的存取控管。
- 新增 Data Layer `searchStudentCandidates()`（`lib/data/student-picker.ts`）：以「啟動編號／姓名（含 `realName`／`name`）／暱稱／登入 Email」模糊搜尋既有會員（不比對通訊 Email `commEmail`），標記每筆是否為呼叫者好友並排序（好友優先），支援排除指定 `userId` 清單。
- 新增 Server Action `searchStudentsForInvite(inviteId, query)`（`app/actions/invite-students.ts`）：沿用既有 `canManageInvite` 課程歸屬授權，查詢時自動排除**已在該課程**的學員（伺服器端依 `inviteId` 查現有報名名單決定排除清單，不信任前端傳入），呼叫 `searchStudentCandidates()`。
- **課程新增學員套用**：`AddStudentDialog`（`components/admin/invite-student-cells.tsx`）移除原本「輸入 Email 或啟動編號」文字框與其確認列查詢邏輯，改為「選擇學員」按鈕開啟 `StudentPicker`（帶入操作者的好友清單與上述搜尋函式），選定後顯示確認列（精簡樣式，僅顯示「姓名（啟動編號）」），其餘（已結業補登、人數上限、送出）行為不變。
- Server Action `addStudentToInvite()` 改以 `userId`（`StudentPicker` 直接回傳既有會員的 `userId`）取代原本的 `identifier` 字串輸入，移除「依格式判斷 Email／啟動編號」的解析步驟；`lookupMemberByIdentifier()` 隨舊輸入框一併移除（不再有任何呼叫端使用）。
- 課程頁 (`app/[locale]/(user)/course/[id]/page.tsx`) 於管理者／該課講師情境下，額外查詢操作者的好友清單（`getMyFriends`）並沿 `ApprovedStudentsSection` → `AddStudentDialog` 傳入。

## Capabilities

### Added Capabilities
- `student-picker`：通用「學員選擇元件」——模糊搜尋（編號／姓名／暱稱／Email）＋好友優先排序＋好友清單直接點選＋單選回傳

### Modified Capabilities
- `admin-enrollment-management`：「新增學員（僅限既有會員）」需求的選人方式由「手動輸入 Email 或啟動編號單一欄位＋查詢確認列」改為「透過學員選擇元件搜尋／點選好友選定既有會員」；查無會員的錯誤情境改為選定後才可能出現的邊界情況（選定後、送出前該帳號恰被刪除），其餘規則（僅限既有會員、`materialChoice` 決定邏輯、重複報名擋下、人數上限）不變

## Impact

- **新元件**：`components/shared/student-picker.tsx`（新增）
- **Data Layer**：`lib/data/student-picker.ts`（新增，`searchStudentCandidates`）
- **Server Actions**：`app/actions/invite-students.ts` 新增 `searchStudentsForInvite`；`addStudentToInvite` 參數由 `identifier` 改為 `userId`；移除 `lookupMemberByIdentifier`
- **既有元件**：`components/admin/invite-student-cells.tsx`（`AddStudentDialog` 改用 `StudentPicker`）
- **頁面**：`app/[locale]/(user)/course/[id]/page.tsx` 新增好友清單查詢並傳遞給 `ApprovedStudentsSection` → `AddStudentDialog`；`app/[locale]/(user)/course/[id]/approved-students-section.tsx` 新增 `friends` prop 透傳
- 不影響 Prisma schema／migration（沿用既有 `User`／`Friendship`／`InviteEnrollment` 資料模型）
- i18n：本次新增文案沿用 `components/admin/` 現行做法維持繁體中文硬編碼（後台專屬字串，依 CLAUDE.md i18n 規範「後台與其專屬字串本階段維持繁體」），不新增 `messages/*.json` key
- 不影響 `community-friends`（好友資料來源與排序沿用既有 `getMyFriends`，未修改該模組任何函式）
