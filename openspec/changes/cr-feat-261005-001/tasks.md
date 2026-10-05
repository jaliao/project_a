## 1. 動作定義與資料層

- [x] 1.1 `config/admin-log-action.ts`：新增 `course_invite_transfer: { label: '轉移班級', trigger: '管理者於會員詳情頁將該老師名下班級轉移給另一位老師時。' }`
- [x] 1.2 `lib/data/teacher-picker.ts`（新檔）：`searchTeacherCandidates(requiredRoles, query, excludeUserIds)`，依 `roles: { hasEvery: requiredRoles }` 過濾（不套用 admin/superadmin override），其餘模糊搜尋邏輯比照 `lib/data/student-picker.ts` 的 `searchStudentCandidates`

## 2. Server Action

- [x] 2.1 `app/actions/admin.ts`：新增 `transferCourseInvites(fromUserId, toUserId, inviteIds: number[])` 與其搜尋包裝 `searchTeachersForTransfer(courseCatalogIds, query, excludeUserIds)`
  - 僅管理者（`canAccessAdmin`）可執行；`fromUserId === toUserId` 或 `inviteIds` 為空時拒絕並回傳明確訊息
  - 查詢 `inviteIds` 對應的 `CourseInvite`，驗證皆存在且 `createdById === fromUserId`
  - 依涵蓋的 `courseCatalogId` 轉成所需書籍講師身分（`TEACHER_ROLE_BY_CATALOG`），對目標老師以 `hasRole()` 嚴格驗證（不用 `canTeachBook()`，理由見 design.md 決策 2）；缺少任一身分時列出缺少的書籍名稱並整批拒絕
  - 於單一 `$transaction` 內：`courseInvite.updateMany` 改 `createdById`，並對每個被轉移班級各建立一筆 `AdminActionLog`（`action: 'course_invite_transfer'`）
  - `revalidatePath` 來源/目標老師的會員詳情頁，以及每個被轉移班級的 `/course/${id}` 頁
  - `npx tsc --noEmit` 已確認通過

## 3. 前端 UI

- [x] 3.1 `components/admin/member-course-invite-transfer.tsx`（新檔，client component）：Dialog 內含班級勾選清單（預設全選）＋重用 `StudentPicker`（`friends={[]}`、`onSearch` 接 `searchTeachersForTransfer`、呼叫端轉接 `TeacherPickerCandidate → StudentPickerSelection` 固定帶 `isFriend: false`）選擇目標老師，確認後呼叫 `transferCourseInvites`
- [x] 3.2 `app/[locale]/(admin)/admin/members/[id]/page.tsx`：「授課紀錄」區塊標題旁加「轉移班級」按鈕（`invites.length === 0` 時元件回傳 `null` 不渲染），掛載 3.1 的 Dialog 元件，傳入 `member.courseInvites`（含 `id/title/courseCatalogId/courseCatalog.label/_count.enrollments`，皆已在既有 `getMemberDetail` select 內，不需額外補欄位）

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 與 `npm run build` 皆成功，無編譯錯誤
- [x] 4.2 情境：目標老師實際具備所需書籍講師身分 → 轉移成功，`CourseInvite.createdById` 正確改變，每個被轉移班級各有一筆 `AdminActionLog`。**已實測**（`docker compose exec web`，比照 `transferCourseInvites` 核心邏輯於容器內對 project_a 自己的 dev DB 建立暫存班級/老師驗證）：轉移 1 個班級，回傳成功訊息，該班級 `createdById` 正確改變，`AdminActionLog`（`action=course_invite_transfer`）剛好 1 筆
- [x] 4.3 情境：目標老師缺少其中一個所需身分（跨多本書的勾選） → 整批拒絕，訊息列出缺少的書籍名稱，`CourseInvite.createdById` 全部維持不變。**已實測**：勾選跨「啟動靈人」「啟動豐盛」兩班，目標老師僅具「啟動靈人」身分 → 回傳「目標老師須具備「啟動豐盛」講師身分才能接收這些班級」，兩個班級 `createdById` 皆維持原老師
- [x] 4.4 情境：目標老師僅具 `admin`／`superadmin` 身分、無對應書籍講師身分 → 比照 4.3 被拒絕（不因管理者身分放行）。**已實測**：純 `admin` 身分目標老師 → 回傳「目標老師須具備「啟動靈人」講師身分才能接收這些班級」，未因 admin 身分放行
- [x] 4.5 情境：非管理者（一般會員或僅具書籍講師身分）直接呼叫 `transferCourseInvites` → 回傳無權限，無資料異動。**已實測**：`actorRoles=['user','teacher_1']`（無 admin/superadmin）→ 回傳「無權限」
- [x] 4.6 情境：轉移後，原本因 `invite_enrollments_inviteId_fkey`／`course_invites_createdById_fkey` 被擋下刪除的講師帳號（來源老師，轉移後名下已無班級、也無其他關聯資料）→ 改用 `deleteMember` 可正常刪除成功（與 `cr-fix-261005-001` 互補驗證）。**已實測**：把來源老師名下兩個班級都轉走後，比照 `deleteMember` 交易邏輯刪除該老師帳號，成功
- [x] 4.7 情境：轉移後，該班級下學員的 `InviteEnrollment`（報名記錄／結業時間）維持不變，僅 `createdById` 改變。**已實測**：轉移前後比對同一筆 `InviteEnrollment` 完整內容（含 `graduatedAt`）序列化結果相同
- [x] 4.8 情境：Dialog 取消勾選部分班級後確認 → 僅勾選的班級被轉移，未勾選的班級 `createdById` 不變。**已實測**（Server Action 層級，等同於前端只勾選其中一個班級送出）：只轉移 inviteA，inviteB 的 `createdById` 轉移前後不變

**注意**：以上皆為 Server Action / Prisma 交易層級驗證（於 `docker compose exec web` 容器內，對 project_a 自己的 dev DB），非瀏覽器實際操作——容器內無瀏覽器也無現成管理者登入 session。前端 Dialog 的畫面呈現（勾選框操作、StudentPicker 搜尋結果呈現、toast 顯示）建議使用者有空時於瀏覽器實際操作一次確認。測試用暫存帳號／班級／報名記錄／AdminActionLog 皆已於腳本內清除，並以 `user.findMany({ email contains '@example.invalid' })` 二次確認殘留數量為 0。
