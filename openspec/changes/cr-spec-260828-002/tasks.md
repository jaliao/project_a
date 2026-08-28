## 1. Schema（Zod）

- [x] 1.1 `lib/schemas/course-session.ts`：`courseSessionSchema` 新增選填 `targetTeacherId: z.string().uuid().optional()`（僅型別把關，授權於 server action 判定）

## 2. Server actions — 代講師建立授課

- [x] 2.1 `app/actions/course-session.ts` `createCourseSession`：解析 `parsed.data.targetTeacherId`
- [x] 2.2 代建立分支（`targetTeacherId` 有值且 `!== session.user.id`）：
  - 要求 `canAccessAdmin(session.user.roles)`，否則 `{ success:false, message:'無權限' }`
  - `prisma.user.findUnique({ where:{ id: targetTeacherId }, select:{ id:true, roles:true } })`，不存在則 `{ success:false, message:'找不到該老師' }`
  - 以 `hasRole(target.roles, TEACHER_ROLE_BY_CATALOG[d.courseCatalogId])` 驗證目標持有該書別身分（**不呼叫 `canTeachBook`**）；不符回 `{ success:false, message:\`須具備${course.label}講師身分才能授課\` }`
  - `createdById = targetTeacherId`
- [x] 2.3 未帶 `targetTeacherId`：維持現行（`canTeachAny` → `canTeachBook` → `createdById = session.user.id`）
- [x] 2.4 人數上限：維持 `resolveMaxCapacity(canAccessAdmin(session.user.roles))`（以操作者為準）
- [x] 2.5 「授課已建立」`createNotification` 收件人：代建立時為 `targetTeacherId`，否則 `session.user.id`

## 3. Server actions — 課程頁權限對齊

- [x] 3.1 `app/actions/course-invite.ts` `approveEnrollment`：守衛改為 `enrollment.invite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)` → 回「無權限執行此操作」
- [x] 3.2 `startCourseSession`：同 3.1 放寬守衛；`evaluateCourseStartGate` 門檻檢查不變
- [x] 3.3 `upsertInstructorFeedback`：守衛改為 `enrollment.invite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)` → 回「無權限」；「僅可對已結業學員」不變
- [x] 3.4 `cancelCourseSession`：課程層通知（`createNotification`）收件人由 `session.user.id` 改為 `invite.createdById`（管理者代取消時老師仍收到）
- [x] 3.5 `updateMatchSettings`：現行已允許 owner 或 admin，確認無需改動（僅 UI 開放，見 4.3）

## 4. 課程頁 UI（`app/[locale]/(user)/course/[id]/`）

- [x] 4.1 `page.tsx`：`PendingEnrollmentList` 顯示條件 `isInstructor` → `isInstructor || isAdmin`
- [x] 4.2 `page.tsx`：結業區塊內 `InstructorFeedbackButton` 顯示條件 `isInstructor` → `isInstructor || isAdmin`
- [x] 4.3 `page.tsx`：`MatchSettingsEditor` 顯示條件 `isInstructor && !isCancelled && !isCompleted` → `(isInstructor || isAdmin) && !isCancelled && !isCompleted`
- [x] 4.4 `page.tsx`：拆分 `{isInstructor && (<><CopyInviteLinkButton/><CourseContactAdminButton/></>)}` — `CopyInviteLinkButton` 用 `isInstructor || isAdmin`；`CourseContactAdminButton` 維持 `isInstructor`；外層顯示條件相應調整
- [x] 4.5 `page.tsx`：`CourseDetailActions` 開始上課區塊 gate — 傳一個 `canManageStart={isInstructor || isAdmin}`（或改傳既有旗標）供區塊使用
- [x] 4.6 `course-detail-actions.tsx`：開始上課區塊條件 `!isStarted && !isCancelled && isInstructor` → 改用 4.5 的旗標（`|| isAdmin`）；封存／刪除區塊維持 `isAdmin`；其餘不動

## 5. 代建立精靈（on-behalf 模式）

- [x] 5.1 `components/course-session/create-course-wizard/create-course-wizard.tsx`：`CreateCourseWizardProps` 新增選填 `onBehalfOfUserId?: string`、`onBehalfOfName?: string`；「授課老師」顯示改用 `onBehalfOfName ?? instructorName`
- [x] 5.2 透傳至 `Step3Preview`：送出時把 `targetTeacherId: onBehalfOfUserId` 併入傳給 `createCourseSession` 的 payload
- [x] 5.3 `components/course-session/course-session-dialog.tsx`：`CourseSessionDialogProps` 新增選填 `onBehalfOfUserId?`、`onBehalfOfName?`，透傳給 `CreateCourseWizard`
- [x] 5.4 邀請步驟（`invite-step.tsx` / `inviteBySpirtId`）維持可用，無需改動；確認代建立情境下不因 `createdById` 非操作者而報錯

## 6. 講師個人頁代建立入口（`app/[locale]/(user)/user/[spiritId]/page.tsx`）

- [x] 6.1 新增 `showTeacherSectionForAdmin = !isOwnPage && isAdmin && TEACHER_ROLES.some(r => (user.roles ?? []).includes(r))`
- [x] 6.2 當 `isOwnPageEarly || showTeacherSectionForAdmin` 時才查 `myCourseSessions`（`getMyCourseSessions(user.id, 4)`）、`activeCourses`（`getActiveCourses()`）
- [x] 6.3 `teachableCatalogIds`：本人頁維持取自 session；代建立分支取自**頁主** `user.roles` 經 `CATALOG_BY_TEACHER_ROLE`
- [x] 6.4 「授課」區塊外層顯示條件 `isOwnPage && canTeach` → `(isOwnPage && canTeach) || showTeacherSectionForAdmin`
- [x] 6.5 代建立分支：區塊標題加註「（代 {displayName} 建立）」；`CourseSessionDialog` 傳 `onBehalfOfUserId={user.id}`、`onBehalfOfName={displayName}`、`isAdmin`；不顯示 `TestCourseSessionButton`
- [x] 6.6 授課預覽卡片牆（代建立分支）：連結沿用 `/course/{id}`；「更多授課資訊」連 `/user/{id}/courses`

## 7. i18n（CLAUDE.md #12）

- [x] 7.1 ~~`messages/zh-TW.json`：新增代建立相關字串~~ **不適用**：實作後唯一新增的可見字串「（代 {name} 建立）」位於 `app/[locale]/(user)/user/[spiritId]/page.tsx`，該檔（含「授課」「基本資料」「尚無授課紀錄」等）整體尚未 i18n 化、全為寫死中文；比照 cr-spec-260828-001 對未遷移表單的處理，維持與周邊一致的寫死字串，不在此檔單獨引入 `useTranslations`。精靈元件（`course.wizard` / `course.sessionDialog`）本次僅改 props/邏輯，無新增文案。
- [x] 7.2 ~~`messages/en.json`：補對應英文~~ **不適用**：同 7.1，無新增 i18n 鍵。
- [x] 7.3 不手改 `messages/zh-CN.json`（未新增鍵，`prebuild` 的 `gen:zh-cn` 照舊）

## 8. 驗證

- [x] 8.1 `npm run lint` — 0 errors（16 個既有 warning 與本次變更無關）
- [x] 8.2 `npm run build` — `✓ Compiled successfully`、TypeScript 通過、靜態頁 98/98 產生（prebuild `gen:zh-cn` 一併通過）
- [x] 8.3 無瀏覽器自動化工具，改以程式碼確認：`showTeacherSectionForAdmin`（`!isOwnPageEarly && isAdminEarly && pageOwnerTeacherCatalogIds.length>0`）對 teacher_2 會員為 true → 授課區塊與 `CourseSessionDialog` 顯示；`onBehalfOfUserId={user.id}` → `Step3Preview` 併入 `targetTeacherId` → `createCourseSession` 代建立分支 `createdById = targetTeacher.id`、通知寄 `createdById`
- [x] 8.4 程式碼確認：代建立時 `teachableCatalogIds = pageOwnerTeacherCatalogIds`（teacher_1 → `[1]`）；`create-course-wizard` 傳 `isAdmin={canPickAnyBook}`（`isAdmin && !isOnBehalf` → 代建立時 false），`Step1CourseCard` 僅開放 `teachableCatalogIds.includes(course.id)`；server 端 `hasRole(target.roles, TEACHER_ROLE_BY_CATALOG[courseCatalogId])` 不符即回「須具備…講師身分才能授課」
- [x] 8.5 程式碼確認：`isOnBehalf`（targetTeacherId 有值且非本人）分支首行 `if (!canAccessAdmin(session.user.roles)) return { success:false, message:'無權限' }`
- [x] 8.6 程式碼確認：`page.tsx` `PendingEnrollmentList`／`InstructorFeedbackButton`／`MatchSettingsEditor`／`CopyInviteLinkButton` 皆改 `isInstructor || isAdmin`；`CourseDetailActions` 收 `canManageStart={isInstructor || isAdmin}`；server `approveEnrollment`／`startCourseSession`／`upsertInstructorFeedback` 守衛加 `|| canAccessAdmin`；`updateMatchSettings` 原本即允許 owner 或 admin
- [x] 8.7 程式碼確認：`CourseContactAdminButton` 仍為 `{isInstructor && ...}`；`course-detail-actions.tsx` 封存／刪除區塊仍 `{isAdmin && ...}` 未動
- [x] 8.8 程式碼確認：一般學員（`!isInstructor && !isAdmin`）下所有上述區塊條件皆為 false，與變更前一致；操作按鈕列外層 `((canEditInfo && !isCancelled) || isInstructor || isAdmin)` 對學員仍為 false
- [x] 8.9 程式碼確認：本人頁 `showTeacherSectionForAdmin` 為 false → `onBehalfOfUserId` 傳 `undefined` → `Step3Preview` payload 不含 `targetTeacherId` → `createCourseSession` else 分支（`canTeachBook` → `createdById = session.user.id`、通知寄自己），與變更前一致

## 9. 文件與版本號（CLAUDE.md #7、#9）

- [x] 9.1 `doc/老師手冊.md`：檔首 v0.1.174（2026-08-28）＋本版更新註記；第三章加「管理者也可以代你新增授課」說明；第十一章末加「管理者可協助操作你的課程」清單（含例外：聯繫管理者、封存／刪除）
- [x] 9.2 `doc/管理者操作手冊.md`：檔首 v0.1.174（2026-08-28）＋本版更新註記；第七章新增「代講師新增授課」小節（入口在 `/user/{啟動編號}`、書別限講師持有身分、建立者為講師、人數放寬）；「課程狀態操作」小節補核准待審報名／開始上課（門檻不變）／講師資格回饋／公開媒合／複製邀請連結，並改寫原「開始上課仍為講師專屬」；情境 E 同步
- [x] 9.3 `config/version.json`：`0.1.173` → `0.1.174`，`updatedAt` = `2026-08-28`。`doc/學員手冊.md` 本次無實質異動（FAQ 已於前一 CR 下架），不改

## 10. README-AI.md 索引同步（CLAUDE.md #8）

- [x] 10.1 `ai-context/06-development-standards.md` 或 `05-business-logic.md`：補「管理者於課程頁與該課講師權限對齊」「代講師建立授課」的規則摘要
- [x] 10.2 `ai-context/07-current-tasks.md`「已完成」清單最前面新增 CR-SPEC-260828-002 記錄
