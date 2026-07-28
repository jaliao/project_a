## 1. 共用上限解析邏輯

- [x] 1.1 將 `resolveMaxCapacity(isAdmin)` 自 `app/actions/course-session.ts` 移至 `lib/data/admin-settings.ts` 並匯出
- [x] 1.2 `app/actions/course-session.ts` 改為 import 共用的 `resolveMaxCapacity`，確認既有開課／編輯課程行為不變

## 2. 新增學員人數上限檢查（server）

- [x] 2.1 `addStudentToInvite`（`app/actions/invite-students.ts`）於 `canManageInvite`／`cancelledAt` 檢查後，加入已核准人數查詢（`prisma.inviteEnrollment.count`）與 `resolveMaxCapacity(canAccessAdmin(session.user.roles))` 上限比對
- [x] 2.2 非管理者且加入後已核准人數將超過上限時，回傳 `{ success: false, message: '已達班級人數上限（N 人），如需超過請洽管理者' }`，不執行後續查會員／建立報名

## 3. UI 提前停用（AddStudentDialog）

- [x] 3.1 `AddStudentDialog`（`components/admin/invite-student-cells.tsx`）新增 `approvedCount`、`capacity`、`isAdmin` props；非管理者且 `approvedCount >= capacity` 時停用送出按鈕並顯示已達上限提示
- [x] 3.2 `ApprovedStudentsSection`（`app/[locale]/(user)/course/[id]/approved-students-section.tsx`）新增 `isAdmin`、`capacity` props，並將 `students.length` 作為 `approvedCount` 一併傳入 `AddStudentDialog`
- [x] 3.3 `page.tsx`（`app/[locale]/(user)/course/[id]/page.tsx`）取得 `capacity`（沿用頁面既有的 `classMaxCapacity` 計算結果），連同既有 `isAdmin` 傳入 `ApprovedStudentsSection`

## 4. 驗證

- [x] 4.1 老師身分：對已核准人數達「班級人數上限」設定值（預設 7）的班級開啟新增學員對話框，確認送出按鈕停用且顯示提示；直接呼叫 action 亦應被拒絕
- [x] 4.2 老師身分：對未達上限的班級新增既有會員，確認成功加入
- [x] 4.3 管理者身分：對已達或超過上限的班級新增既有會員，確認不受限制、成功加入
- [x] 4.4 確認開課／編輯課程既有的人數上限行為（`resolveMaxCapacity` 搬移後）未受影響
