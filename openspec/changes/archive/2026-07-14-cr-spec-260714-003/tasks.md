# cr-spec-260714-003 Tasks

## 1. 共用卡片編號

- [x] 1.1 `components/course-session/course-session-card.tsx`：新增必要 prop `inviteId`，標籤列最前顯示 `#編號`（`font-mono text-xs text-muted-foreground`）
- [x] 1.2 全部使用處補傳 `inviteId`（開課管理、我的開課、媒合布告欄、學員課程列表、dashboard 課程預覽等，以 grep 全查）

## 2. Server Actions 權限與新作業

- [x] 2.1 `app/actions/invite-students.ts`：抽 `canManageInvite`（管理者或該課建立者）判定；`addStudentToInvite`／`removeStudentFromInvite` 守衛改用之；`lookupMemberByEmail` 新增 `inviteId` 參數並以 `canManageInvite` 授權
- [x] 2.2 `app/actions/course-invite.ts`：`graduateCourse`／`cancelCourseSession` 守衛由 `createdById === uid` 改「建立者或 `canAccessAdmin`」；結業頁 `/course/[id]/graduate` 守衛同步放行管理者
- [x] 2.3 新增 `reopenRecruitment(inviteId)` action：守衛「建立者或管理者」；前置進行中（`startedAt != null && !completedAt && !cancelledAt`）；清除 `startedAt`；不通知、不寫 LOG；`revalidatePath`
- [x] 2.4 刪除 `setCourseStatusAdmin`（`app/actions/course-session.ts`）

## 3. 課程頁 UI

- [x] 3.1 `lib/data/course-sessions.ts`：`getCourseSessionById` enrollment select 補 `_count.shipmentItems` 與 `user.spiritId`
- [x] 3.2 已核准學員區塊抽成 client 元件 `ApprovedStudentsSection`（接收序列化學員資料＋`canManage`）：標題列右側「新增學員」「移除學員」按鈕（比照基本資訊「編輯」樣式，僅 `canManage` 渲染）；移除模式切換（各卡顯示移除按鈕＋啟動編號，Email 仍不顯示）；一般學員視角與現行完全相同
- [x] 3.3 `AddStudentDialog`／`RemoveStudentButton`（`components/admin/invite-student-cells.tsx`）調整供課程頁使用（lookup 帶 `inviteId`；文案「班級」→「課程」視情況微調）
- [x] 3.4 `CourseDetailActions` 渲染條件改 `isInstructor || isAdmin`，內部分區塊權限：教材申請／開始上課僅 `isInstructor`；結業作業／取消授課 `isInstructor || isAdmin`；新增「重新招募作業」區塊（進行中顯示，說明＋「退回招生中」＋確認 dialog，呼叫 `reopenRecruitment`）
- [x] 3.5 課程頁新增「課程操作 LOG」區塊（server 渲染，`isInstructor || isAdmin`；`getAdminLogs({ inviteId })` 最新 30 筆，卡片列樣式沿用原後台頁，註記「顯示最近 30 筆」；位置在講師操作區之後）

## 4. 後台退場

- [x] 4.1 `admin/course-sessions/page.tsx`：移除 `#編號`＋「⋯」列（卡片編號由共用卡片顯示）；刪除 `components/course-session/course-session-actions-menu.tsx`
- [x] 4.2 刪除 `app/[locale]/(admin)/admin/course-sessions/[id]/students/page.tsx` 與 `app/[locale]/(admin)/admin/operation-logs/page.tsx`；`admin/page.tsx` 移除「操作紀錄」功能格
- [x] 4.3 `lib/data/invite-students.ts`：刪除 `getInviteStudentsAdmin`（保留 `findMemberByEmail`）；`lib/data/admin-logs.ts` 保留

## 5. 驗證

- [x] 5.1 `npm run lint` 與 `npm run build` 通過
- [x] 5.2 手動驗證——卡片編號：開課管理／我的開課／媒合布告欄／學員課程列表卡片標題上方皆顯示 `#編號`
- [x] 5.3 手動驗證——課程頁學員增刪：管理者與該課講師可見按鈕並可新增（掛帳號／建帳號＋臨時密碼）／移除（警示、教材擋下）；非該課講師與學員看不到按鈕；LOG 區塊顯示紀錄（管理者＋講師可見、學員不可見）
- [x] 5.4 手動驗證——作業區塊：進行中課程顯示重新招募作業，退回招生中後可重新邀請／開始上課；管理者可代講師執行重新招募／結業／取消；教材申請與開始上課對管理者（非講師）不顯示
- [x] 5.5 手動驗證——後台退場：開課管理無編號列與「⋯」選單；`/admin/course-sessions/[id]/students` 與 `/admin/operation-logs` 為 404；dashboard 無操作紀錄功能格

## 6. 文件與版本

- [x] 6.1 更新 `doc/管理者操作手冊.md`：第七章（開課管理：移除選單說明、狀態操作改課程頁作業區塊）、第十七／十八章改寫為課程頁操作（學員增刪、重新招募、LOG 區塊），並更新檔首版本標註與日期
- [x] 6.2 更新 `doc/老師手冊.md`：新增課程頁學員增刪（講師可自行操作、臨時密碼轉交）、重新招募作業、課程操作 LOG 說明；修正原「名單有誤請回報管理員」FAQ；更新檔首版本標註與日期
- [x] 6.3 檢查 `doc/學員手冊.md`：卡片顯示編號如有畫面描述需同步（無則免改）
- [x] 6.4 `config/version.json` patch +1 並更新 `updatedAt`
- [x] 6.5 依 `.ai-rules.md` 重新產生 `README-AI.md`
