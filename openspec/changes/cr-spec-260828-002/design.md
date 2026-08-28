## Context

- 授課即 `CourseInvite`；建立者 `createdById` 即「該課講師」，全系統以 `isInstructor = (createdById === 當前使用者)` 判定講師視圖。
- 「新增授課」入口目前僅在 `/user/[spiritId]` 本人頁的「授課」區塊（`isOwnPage && canTeachAny(roles)`），元件為 `CourseSessionDialog` → `CreateCourseWizard`（三步驟＋邀請步驟），`Step3Preview` 呼叫 `createCourseSession(formValues)`，一律以 `session.user.id` 為建立者。
- `createCourseSession`（`app/actions/course-session.ts`）現有守衛：`canTeachAny(roles)` → Zod → 人數上限（`resolveMaxCapacity(canAccessAdmin)`）→ 課程存在且啟用 → `canTeachBook(roles, courseCatalogId)`（**對 admin 恆為 true**）。
- 課程頁 `/course/[id]`（`app/[locale]/(user)/course/[id]/page.tsx`）已將「編輯課程資訊、已核准學員增刪、教材申請、結業／重新招募／結業回退／取消、操作 LOG」以 `isInstructor || isAdmin` 開放；仍為 owner 專屬者見 proposal 盤點表。
- `canAccessAdmin`、`canTeachBook`、`canTeachAny`、`TEACHER_ROLE_BY_CATALOG`、`CATALOG_BY_TEACHER_ROLE`、`TEACHER_ROLES`、`hasRole` 皆在 `lib/auth-roles.ts`。
- 課程 FAQ 已於 CR-SPEC-260828-004 自系統移除，本設計不再涉及 `course-message` / `CourseFaq`。

## Goals / Non-Goals

**Goals**
- 管理者於「具書籍講師身分」之會員的 `/user/[spiritId]` 頁，代該老師建立授課（建立者為該老師）。
- 管理者在 `/course/[id]` 取得與該課講師一致的操作權限（proposal 第 2 節列舉項）。
- UI 與 server action 授權一致（不只隱藏入口）。

**Non-Goals**
- 不新增資料表 / 欄位；不改 `CourseInvite` 資料模型。
- 不賦予講師「封存／刪除課程」能力（維持 admin 專屬）。
- 不改「聯繫管理者」按鈕的講師專屬語意。
- 不做「替非講師會員建立授課」。
- 不改開課門檻（`evaluateCourseStartGate`）條件。
- 不新做一個獨立的後台代開課表單（沿用既有精靈）。

## Decisions

### 1. 沿用 `CreateCourseWizard`，加「代建立」模式，而非新做後台表單
新增選填 prop `onBehalfOfUserId?: string` / `onBehalfOfName?: string`，一路透傳至 `Step3Preview`，於送出時把 `targetTeacherId` 併入 `createCourseSession` 的 payload。理由：欄位、驗證、預設值、UX 全部共用，維護面最小；管理者本就是精靈既有使用者（`isAdmin` 放寬人數上限的路徑已存在）。
- 精靈的「授課老師」顯示改用 `onBehalfOfName ?? instructorName`。
- Step1 可選課程清單用呼叫端傳入的 `teachableCatalogIds`；代建立時由**頁主的** `roles` 經 `CATALOG_BY_TEACHER_ROLE` 推導。
- 邀請步驟（`inviteBySpirtId`）維持可用；由管理者代送的邀請通知照常寄給受邀學員，無額外處理。

### 2. `createCourseSession` 代建立分支（server 權威）
```
targetTeacherId 有值且 !== session.user.id：
  - 要求 canAccessAdmin(session.user.roles)，否則 { success:false, message:'無權限' }
  - 讀取 target = prisma.user.findUnique({ id: targetTeacherId }, select roles)
  - 要求 target 存在
  - 對 courseCatalogId：要求 hasRole(target.roles, TEACHER_ROLE_BY_CATALOG[courseCatalogId])
    （直接查身分，**不呼叫 canTeachBook**——那會因 target 可能也是 admin 而誤放行非持有書別）
  - createdById = targetTeacherId
  - 「授課已建立」通知寄給 targetTeacherId
否則：維持現行（createdById = session.user.id，canTeachBook 判定，通知給自己）
```
人數上限：`resolveMaxCapacity(canAccessAdmin(session.user.roles))` — 以「操作者」為準（代建立時操作者為管理者，維持可放寬）。

### 3. 課程頁權限對齊：統一為「該課講師或管理者」
概念述語：`canManageCourse = isInstructor || canAccessAdmin(roles)`。頁面已有等義的 `canEditInfo` / `canManageMaterials` / `canViewGraduation`，本次把剩餘 owner 專屬點一併對齊：

| 位置 | 變更 |
|---|---|
| `page.tsx` `PendingEnrollmentList` 顯示 | `isInstructor` → `isInstructor || isAdmin` |
| `page.tsx` `InstructorFeedbackButton`（結業區塊內） | `isInstructor` → `isInstructor || isAdmin` |
| `page.tsx` `MatchSettingsEditor` 顯示 | 加 `|| isAdmin`（action 已放行） |
| `page.tsx` 複製邀請連結按鈕 | `isInstructor` 區塊拆分：`CopyInviteLinkButton` 用 `isInstructor || isAdmin`；`CourseContactAdminButton` 維持 `isInstructor` |
| `page.tsx` → `CourseDetailActions` 開始上課區塊 | 由 `isInstructor` 改為 `isInstructor || isAdmin`（門檻不變） |

server action 對應放寬（各自 `auth()` 後自行判定，不信任 client）：
- `approveEnrollment`：`enrollment.invite.createdById !== user && !canAccessAdmin(roles)` → 擋。
- `startCourseSession`：同上；門檻檢查（`evaluateCourseStartGate`）不變。
- `upsertInstructorFeedback`：`enrollment.invite.createdById !== user && !canAccessAdmin(roles)` → 擋；「僅對已結業學員」不變。
- `updateMatchSettings`：現行已允許 owner 或 admin，無需改 action，僅開放 UI。

### 4. 通知收件人：管理者代為操作時，通知寄給該課講師
現行多處 `createNotification(session.user.id, ...)`（如 `cancelCourseSession`、`createCourseSession`）。放寬後管理者也會觸發這些動作，若寄給 `session.user.id` 會讓「該課講師」收不到自己課程的狀態變化。決策：`createCourseSession`（代建立）、`cancelCourseSession`、以及本次放寬的動作，其「課程層」通知一律寄給 `invite.createdById`。

### 5. `/user/[spiritId]` 授課區塊的管理者分支
- 目前 `isOwnPageEarly` 才查 `myCourseSessions` / `activeCourses` / `teachableCatalogIds`。新增：`showTeacherSectionForAdmin = !isOwnPage && isAdmin && TEACHER_ROLES.some(r => user.roles.includes(r))`。
- 為 true 時：
  - `teachableCatalogIds` 取自**頁主** `user.roles` 經 `CATALOG_BY_TEACHER_ROLE`。
  - 查 `getMyCourseSessions(user.id, 4)`、`getActiveCourses()` 供預覽與精靈。
  - 「授課」區塊標題後加一個小標示「（代 {displayName} 建立）」，`CourseSessionDialog` 傳 `onBehalfOfUserId={user.id}`、`onBehalfOfName={displayName}`、`isAdmin`。
  - `TestCourseSessionButton`（dev 專用、建立者為自己）不在代建立分支顯示。
- 區塊顯示條件維持：`(isOwnPage && canTeach) || showTeacherSectionForAdmin`。

### 6. 「推薦講師」清單相容性
`admin-instructor-recommendations` 以 `InviteEnrollment.teacherRecommended === true` 篩選、並顯示「推薦老師 = 課程 `createdBy`」。管理者代填回饋時課程 `createdBy` 仍是該老師，清單顯示維持一致，無需改動。回饋仍不自動授予任何身分。

## Risks / Trade-offs

- **管理者可提早「開始上課」**：門檻（`evaluateCourseStartGate`）仍於 server 強制，風險有限。
- **代建立的授課由該老師「擁有」**：老師之後在自己頁看到非自己建立的課程屬預期行為；通知已補寄給老師（決策 4）降低突兀感。
- **`targetTeacherId` 偽造**：server 端 `canAccessAdmin` + 目標身分雙重驗證，Zod 僅型別把關；非管理者帶 `targetTeacherId` 直接回「無權限」。
- 純授權放寬 + 一個選填參數，無資料遷移；風險集中在「漏改某一處 server 守衛造成 UI 顯示但操作失敗」，以 tasks 的逐點清單與驗證步驟涵蓋。

## Migration Plan

1. Schema（Zod）：`courseSessionSchema` 加選填 `targetTeacherId`。
2. Server actions：`createCourseSession` 代建立分支；`approveEnrollment` / `startCourseSession` / `upsertInstructorFeedback` 守衛與通知收件人放寬。
3. 課程頁 `page.tsx` + `course-detail-actions.tsx`：套用 `isInstructor || isAdmin`。
4. 精靈：`CourseSessionDialog` / `CreateCourseWizard` / `Step3Preview` 加 `onBehalfOf*` 透傳。
5. `/user/[spiritId]/page.tsx`：管理者代建立分支。
6. i18n 新字串；`npm run lint`、`npm run build`（含 `gen:zh-cn`）。
7. `doc/老師手冊.md`、`doc/管理者操作手冊.md` 同步 + 檔首版本；`config/version.json` patch +1、`updatedAt`。
