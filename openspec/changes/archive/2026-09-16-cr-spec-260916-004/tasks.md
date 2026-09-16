## 1. Data Layer

- [x] 1.1 新增 `lib/data/student-picker.ts`：`StudentPickerCandidate` 型別（`userId`／`spiritId`／`displayName`／`avatarUrl`／`email`／`isFriend`）
- [x] 1.2 同檔新增 `searchStudentCandidates(currentUserId, query, excludeUserIds)`：`where` 比對 `realName`／`name`／`nickname`／`email`／`spiritId`（`contains` + `insensitive`），`id: { notIn: [...excludeUserIds, currentUserId] }`；查 `Friendship`（`ownerId: currentUserId`）標記 `isFriend`；排序好友優先（穩定排序），回傳前 20 筆

## 2. Server Actions

- [x] 2.1 `app/actions/invite-students.ts` 新增 `searchStudentsForInvite(inviteId, query)`：`auth()` + `canManageInvite` 授權；查 `InviteEnrollment`（`where: { inviteId } `）取得已在該班級的 `userId` 清單作為 `excludeUserIds`；呼叫 `searchStudentCandidates`
- [x] 2.2 同檔 `addStudentToInvite`：zod schema 由 `identifier: z.string()` 改為 `userId: z.string()`（實際採 `z.string().trim().min(1)`，非 `.uuid()`——`User.id` 為 `@db.Uuid` 但 Prisma 對應型別為一般字串，沿用專案其他 schema 慣例不額外加 `.uuid()` 格式驗證）；以 `prisma.user.findUnique({ where: { id: userId } })` 取代 `findMemberByIdentifier(identifier)`；查無時回傳欄位錯誤「所選學員不存在，請重新選擇」（key 改為 `errors.userId`）
- [x] 2.3 同檔移除 `lookupMemberByIdentifier`（確認全專案零其他引用後刪除）

## 3. 通用元件 StudentPicker

- [x] 3.1 新增 `components/shared/student-picker.tsx`：Props `open`／`onOpenChange`／`friends: FriendListItem[]`／`onSearch`／`excludeUserIds?: string[]`／`onSelect: (student: StudentPickerSelection) => void`／`title?`／`description?`（`onSearch` 回傳型別以結構相容 `ActionResponse<{candidates}>` 的本地 `SearchResult` 型別表示，避免依賴未匯出的 `ActionResponse`）
- [x] 3.2 同檔：空關鍵字時渲染 `friends`（套用 `excludeUserIds` 過濾），沿用 `getMyFriends()` 原排序；社群好友清單為空時顯示提示文字
- [x] 3.3 同檔：輸入框 debounce（約 300ms）非空關鍵字時呼叫 `onSearch(query)`，loading／查無結果／錯誤三種狀態的畫面呈現
- [x] 3.4 同檔：清單項目樣式沿用 `UserAvatar` ＋ 顯示名稱（參考 `components/conversation/conversation-members-dialog.tsx` 既有清單寫法），好友項目加好友徽章；點擊任一項目呼叫 `onSelect` 並關閉

## 4. 課程新增學員套用

- [x] 4.1 `app/[locale]/(user)/course/[id]/page.tsx`：`canEditInfo`（`isInstructor || isAdmin`）情境下呼叫 `getMyFriends(currentUserId)`，將結果（`myFriends`）傳入 `ApprovedStudentsSection` 的新 `friends` prop
- [x] 4.2 `app/[locale]/(user)/course/[id]/approved-students-section.tsx`：新增 `friends: FriendListItem[]` prop，透傳給 `AddStudentDialog`
- [x] 4.3 `components/admin/invite-student-cells.tsx` 的 `AddStudentDialog`：
  - 移除 `identifier` state、debounce lookup `useEffect`、`lookupMemberByIdentifier` 呼叫、原「Email 或啟動編號」`Input`
  - 新增 `selectedStudent: StudentPickerSelection | null` state；新增 `friends` prop（型別 `FriendListItem[]`）
  - 新增「選擇學員」按鈕開啟巢狀 `StudentPicker`（`onSearch` 包一層呼叫 `searchStudentsForInvite(inviteId, query)`，`friends` 傳入 prop 收到的清單）
  - `onSelect` 設定 `selectedStudent` 並關閉 `StudentPicker`；顯示確認列（精簡樣式，僅顯示「姓名（啟動編號）」，2026-09-16 依使用者要求移除「將加入既有會員：」前綴與「，不會變更其帳號資料」後綴）與「重新選擇」按鈕（清空 `selectedStudent`）
  - `handleSubmit` 呼叫 `addStudentToInvite` 改傳 `userId: selectedStudent.userId`
  - 送出按鈕 `disabled` 條件改為 `isPending || atCapacity || !selectedStudent`
  - `resetForm()` 一併清空 `selectedStudent`
  - 已達人數上限（`atCapacity`）時「選擇學員」入口一併停用

## 5. 驗證

- [x] 5.1 `npm run lint`（0 errors；`components/shared/student-picker.tsx` 曾因 `useEffect` 內同步 `setState` 觸發 `react-hooks/set-state-in-effect` error，改為 `onChange` 直接排程 debounce 後修正；其餘 11 個 warning 皆為既有、與本次無關）
- [x] 5.2 `npm run build`（Compiled successfully；TypeScript 通過；`Can't reach database server at db` 為 host 端建置無法連容器內網 DB 的既有預期訊息，與本次改動無關）
- [x] 5.3 已對本機 dev 容器實際資料庫執行 `searchStudentCandidates`／`getMyFriends` 直接驗證（以 tsx 於容器內執行）＋使用者於瀏覽器完整實測：
  - 以姓名（`測試學員`）、啟動編號部分字串（`PA2690`）、Email 部分字串（`student1`）分別模糊搜尋，皆正確找到既有會員（realName／spiritId／email 三種欄位比對皆生效，`name`／`nickname` 欄位邏輯相同、程式碼路徑一致，未另外個別測試）
  - 排除清單（`excludeUserIds`）生效：傳入後對應會員不出現在結果中；並以課程 439 既有報名學員（`蔡慧芳`／`3bb7d8dd-...`）模擬 `searchStudentsForInvite` 的「已在該課程」排除邏輯，確認排除後搜尋不到該學員（原可搜到，排除後結果數為 0）
  - 自己（`currentUserId`）不會出現在自己的搜尋結果中
  - 好友優先排序：建立臨時 `Friendship`（justin→測試學員1）後重新搜尋，該學員確實排在結果最前、`isFriend=true`；`getMyFriends()` 亦正確反映好友清單；測試後已清理該筆臨時好友關係，未殘留於資料庫
  - **上線後修正**：使用者於 `https://project-a-dev.blockcode.com.tw/course/439` 實測回報「Rain（PA261365）」仍可被選取——Rain 為該課程既有已報名學員（`3bb7d8dd-c290-4712-b2a1-0616da6d13dc`）。根因：`AddStudentDialog` 呼叫 `<StudentPicker>` 時**漏傳 `excludeUserIds` prop**，導致伺服器端搜尋路徑（`searchStudentsForInvite`）已正確排除，但免搜尋的「社群好友快速清單」完全未套用排除。修正：`page.tsx` 依 `courseSession.approvedEnrollments`＋`pendingEnrollments` 算出 `excludeUserIds`，逐層透傳 `approved-students-section.tsx` → `AddStudentDialog` → `StudentPicker`。修正後使用者重新測試確認無誤（好友清單與搜尋結果皆已正確排除已在該課程的學員）
  - **待另案處理**：課程詳情頁另有一個**既有、非本次變更觸及**的 bug（`copy-invite-link-button.tsx:43` `window is not defined`，SSR 階段誤用 `window.location.origin`；該檔案在本次工作前即已處於未提交的修改狀態）在部分情境下仍可能觸發，建議另開票修復，不在本次範圍
- [x] 5.4 已依 CLAUDE.md 規範同步：`doc/管理者操作手冊.md`〈十六、班級學員管理〉「新增學員」小節改寫為「選擇學員」流程；`doc/老師手冊.md`〈學員名單〉新增學員段落同步改寫；`doc/學員手冊.md` 無異動角色未修改；`config/version.json` 0.1.206→0.1.207（2026-09-16）；`README-AI.md` 版本行；`ai-context/07-current-tasks.md`「已完成」清單新增本次 CR 記錄（含上線後修正說明）
