## 1. 資料模型

- [x] 1.1 `prisma/schema/course-invite.prisma` 的 `InviteEnrollment` 新增 `teacherRecommended Boolean?`、`teacherFeedbackNote String?`、`teacherFeedbackAt DateTime?`
- [x] 1.2 產生並套用 migration（`add_instructor_feedback`），重生 Prisma client

## 2. 回饋 Server Action 與驗證

- [x] 2.1 `lib/schemas/` 新增回饋 schema：`enrollmentId`、`recommended: boolean`、`note?: string`（長度上限）
- [x] 2.2 `app/actions/course-invite.ts` 新增 `upsertInstructorFeedback`：載入 enrollment+invite，守衛 `invite.createdById === session.user.id` 且 `enrollment.graduatedAt != null`，否則回無權限/錯誤
- [x] 2.3 寫入 `teacherRecommended`、`teacherFeedbackNote`、`teacherFeedbackAt = now()`，可重複覆蓋；`revalidatePath` 課程詳情頁

## 3. 課程詳情頁—結業資訊回饋入口（限原老師）

- [x] 3.1 結業資訊已結業學員清單，對 `CourseInvite.createdBy === 當前使用者` 顯示「填寫講師資格回饋」控制（Dialog/inline，是/否 + 選填備註）
- [x] 3.2 已填回饋顯示目前推薦狀態並可再次編輯；非建立者與未結業學員不顯示入口
- [x] 3.3 課程詳情資料層補回每位已結業學員的回饋現值（供預填表單與狀態顯示）

## 4. 後台會員管理—檢視回饋

- [x] 4.1 `lib/data/members.ts` 會員查詢的 `inviteEnrollments` select 補 `teacherRecommended`/`teacherFeedbackNote`/`teacherFeedbackAt`、`invite.courseCatalogId`、`invite.createdBy`（老師姓名）
- [x] 4.2 `app/(user)/admin/members/[id]/page.tsx` 學習紀錄逐列顯示推薦狀態（以 `BOOK_LABEL_BY_TEACHER_ROLE[TEACHER_ROLE_BY_CATALOG[catalogId]]` 組「推薦成為{書名}講師」）、備註、推薦老師；未填顯示「未填回饋」
- [x] 4.3 確認回饋僅為參考、不自動授予身分（指派仍走既有「身分編輯」）

## 5. 收尾與同步

- [x] 5.1 `config/version.json` patch 版本號 +1
- [x] 5.2 更新 `README-AI.md`（資料模型新增欄位、新 action、會員詳情顯示）
- [x] 5.3 更新 `doc/老師手冊.md`（結業後填寫講師資格回饋）、`doc/管理者操作手冊.md`（會員詳情檢視回饋）；更新檔首版本與日期
- [x] 5.4 `npx tsc --noEmit` 通過

## 6. 驗證

- [x] 6.1 以原老師對已結業學員填寫回饋（推薦/不推薦/備註），重複編輯以最新為準
- [x] 6.2 非課程建立者（含管理者、其他講師）看不到回饋入口；對未結業學員無入口
- [x] 6.3 管理者於會員詳情學習紀錄正確看到「推薦成為{書名}講師」、備註與推薦老師
