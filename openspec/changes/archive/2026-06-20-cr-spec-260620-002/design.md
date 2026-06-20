## Context

延續 [[member-roles]]（四個書籍講師身分 `teacher_1`～`teacher_4`），本變更新增「講師資格回饋單」：由帶過某學員該課程的**原老師**（`CourseInvite.createdBy`）對**已結業**學員填寫是否推薦其成為該課程（書）的講師，管理者於會員詳情頁檢視後手動加掛對應身分。

現況可重用：
- 課程詳情頁已有「結業資訊」區塊（`course-graduation-info`），列出 `graduatedAt` 有值的學員。
- 會員詳情頁（`/admin/members/[id]`）已有「學習紀錄」區塊，逐筆呈現 `inviteEnrollments`。
- 書名對應：`lib/auth-roles.ts` 的 `TEACHER_ROLE_BY_CATALOG` / `BOOK_LABEL_BY_TEACHER_ROLE`。
- 師生關係概念已存在於 `lib/data/hierarchy.ts`（但僅限啟動靈人）；本回饋以「該課程 `createdBy`」為準，逐課程通用，不限啟動靈人。

## Goals / Non-Goals

**Goals:**
- 在 `InviteEnrollment` 記錄逐書、可重複編輯的講師資格回饋（是/否 + 選填備註 + 時間）。
- 原老師於課程詳情頁結業資訊對已結業學員填寫；權限於 Server Action 權威驗證。
- 管理者於會員詳情頁學習紀錄檢視回饋（推薦書別、備註、老師），作為手動加掛 `teacher_N` 的參考。

**Non-Goals:**
- 不自動授予任何講師身分（指派仍走既有「身分編輯」`updateMemberRoles`）。
- 不新增學員端「表達意願」流程（回饋為老師主動）。
- 不更動結業流程本身（`course-graduation-page` 的填寫步驟不變）。
- 不調整 `hierarchy.ts` 師生樹定義。

## Decisions

### 1. 資料模型：擴充 `InviteEnrollment`（非新表）
回饋天然為「某學員在某課程」一筆，與 `InviteEnrollment` 一對一，故直接擴充欄位而非建新表：
- `teacherRecommended Boolean?` — `null`=未填、`true`=推薦、`false`=不推薦。以可空布林同時表達「是否已填」與「推薦與否」，避免額外旗標。
- `teacherFeedbackNote String?` — 選填備註。
- `teacherFeedbackAt DateTime?` — 填寫/最後更新時間（亦作「已填」判斷依據）。
- 替代方案：獨立 `InstructorFeedback` 表 — 一對一關係下徒增 join 與複雜度，不採用。
- 逐書語意由該 enrollment 的 `invite.courseCatalogId` 推得，不另存書別欄位（單一真實來源）。

### 2. 入口：課程詳情頁「結業資訊」，僅課程建立者可見
於結業資訊已結業學員清單，對 `CourseInvite.createdBy === session.user.id` 顯示每位學員的「填寫講師資格回饋」控制（Dialog 或 inline 表單），已填則顯示推薦狀態並可再編輯。其他角色（含管理者、其他講師）不顯示入口。
- 替代方案：獨立「我的學員回饋」頁 — 與現有結業資訊重複，且結業資訊已是老師檢視已結業學員的自然位置。

### 3. Server Action：`upsertInstructorFeedback`
新增於 `app/actions/course-invite.ts`：
- 入力：`enrollmentId`、`recommended: boolean`、`note?: string`（Zod 驗證，note 長度上限）。
- 守衛（權威）：載入 enrollment + invite；要求 `invite.createdById === session.user.id` 且 `enrollment.graduatedAt != null`，否則回 `{ success:false, message:'無權限' }` / 錯誤。
- 寫入 `teacherRecommended`、`teacherFeedbackNote`、`teacherFeedbackAt = now()`；`revalidatePath` 課程詳情頁。
- 可重複呼叫即覆蓋（upsert 語意以單筆 update 實作）。

### 4. 會員詳情顯示
`lib/data/members.ts` 的會員查詢，`inviteEnrollments` select 補 `teacherRecommended`/`teacherFeedbackNote`/`teacherFeedbackAt`、`invite.courseCatalogId`、`invite.createdBy`（老師姓名）。`/admin/members/[id]/page.tsx` 學習紀錄逐列顯示：推薦狀態（以 `BOOK_LABEL_BY_TEACHER_ROLE[TEACHER_ROLE_BY_CATALOG[catalogId]]` 組「推薦成為{書名}講師」）、備註、推薦老師；未填顯示「未填回饋」。

### 5. Migration：純新增欄位
三個欄位皆可空、無預設破壞性，`make schema-update name=add_instructor_feedback`（或對齊現行手動 migration 流程）。既有資料 `teacherRecommended` 即為 null（未填），無需回填。

## Risks / Trade-offs

- [可空布林三態（null/true/false）易誤判] → 一律以 `teacherFeedbackAt != null`（或 `teacherRecommended !== null`）判定「已填」，UI 與資料層統一此判斷。
- [原老師認定：跨書由各課程 `createdBy` 決定，與 hierarchy.ts 僅限啟動靈人不同] → 本功能以「該課程建立者」為唯一依據，文件明述，避免與師生樹混淆。
- [課程移交/建立者異動情境] → 現行無移交功能，`createdBy` 穩定；若未來支援移交需一併檢視回饋權限。
- [回饋為參考、需人工加掛身分，可能漏指派] → 屬流程設計（保留管理者裁量）；會員詳情清楚並列回饋與身分編輯以利操作。

## Migration Plan

1. `prisma/schema/course-invite.prisma` 的 `InviteEnrollment` 新增三欄位。
2. 產生並套用 migration（對齊現行流程：`make prisma-dev-deploy` 套用、必要時手寫 migration 檔），重生 client。
3. 新增 `lib/schemas/` 回饋 schema 與 `upsertInstructorFeedback` action。
4. 課程詳情頁結業資訊新增回饋控制（僅 `createdBy`）。
5. 會員詳情頁學習紀錄顯示回饋；`lib/data/members.ts` 補 select。
6. 同步 `config/version.json` patch +1、`README-AI.md`、`doc/老師手冊.md`、`doc/管理者操作手冊.md`。

回滾：欄位可空、無破壞性；移除 UI 與 action 即可，欄位可保留或於後續 migration 移除。

## Open Questions

- 會員匯出 Excel 是否需新增「講師資格回饋」欄位（推薦書別/備註）。預設：本期不納入，待管理者需求再加。
- 是否需記錄推薦老師為快照（姓名）以防老師資料變動。預設：顯示時即時 join `invite.createdBy`，不另存快照。
