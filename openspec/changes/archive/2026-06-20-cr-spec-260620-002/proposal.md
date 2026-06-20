## Why

四個書籍講師身分（`teacher_1`～`teacher_4`，見 [[member-roles]]）目前只能由管理者憑印象指派，缺少帶課講師的第一手評估。實務上，有些學員結業後**後來才願意成為講師**；此時應由**帶過他的原老師**填寫一份「講師資格回饋單」，評估其是否適合擔任該課程的講師，管理者再據此指派。讓資格認定有來自原老師的依據、可追溯。

## What Changes

- 新增「講師資格回饋單」：**帶過某學員該課程的原老師**（該 `CourseInvite.createdBy`）可對**已結業**（`graduatedAt` 有值）的學員填寫回饋，評估其是否有資格成為**該課程（書）**的講師。
- 入口在**已結業課程詳情頁的「結業資訊」區塊**：已結業學員清單中，僅課程建立者可見每位學員的「填寫講師資格回饋」按鈕與已填狀態。
- 回饋為**老師主動填寫**（不需學員先申請），逐書語意：回饋對應該課程的書（`courseCatalogId` → 書籍講師身分，見 [[member-roles]] 的「講師身分與書籍對應」）。
- 回饋內容為**是/否**（是否推薦成為該課程講師）+ **選填備註**，儲存於該學員的 `InviteEnrollment`。
- 管理者於會員詳情頁（`/admin/members/[id]`）的學習紀錄，可看到每筆結業是否獲原老師推薦、推薦書別、備註與老師；管理者據此以既有「身分編輯」手動加掛對應 `teacher_N`（回饋為**參考資訊**，不自動授予身分）。
- 僅**已結業**學員可被回饋；未結業學員不顯示回饋入口。回饋可重複編輯（以最新一次為準）。

## Capabilities

### New Capabilities
- `instructor-feedback`: 講師資格回饋單的資料模型與規則——由該課程建立者（原老師）對已結業學員填寫（是/否 + 選填備註）、逐書語意、儲存於 `InviteEnrollment`，並於後台會員詳情頁供管理者檢視作為指派講師身分的參考。

### Modified Capabilities
- `course-graduation-info`: 已結業課程「結業資訊」區塊的已結業學員清單，對**課程建立者**新增「填寫講師資格回饋」入口與已填狀態顯示。

## Impact

- **資料模型**：`prisma/schema/course-invite.prisma` 的 `InviteEnrollment` 新增 `teacherRecommended Boolean?`（null=未填、true=推薦、false=不推薦）、`teacherFeedbackNote String?`、`teacherFeedbackAt DateTime?`（migration）。
- **回饋填寫**：課程詳情頁結業資訊區塊（`course-session-detail` / `course-graduation-info` 對應元件）新增回饋表單/Dialog；新增 Server Action（`app/actions/course-invite.ts`，守衛 `CourseInvite.createdBy === 當前使用者` 且學員 `graduatedAt` 有值）、`lib/schemas/` 回饋 schema。
- **後台會員管理**：`app/(user)/admin/members/[id]/page.tsx` 學習紀錄區塊、`lib/data/members.ts`（`inviteEnrollments` select 補回饋欄位、書名/老師）。
- **顯示對應**：引用 [[member-roles]] 的 `TEACHER_ROLE_BY_CATALOG` / `BOOK_LABEL_BY_TEACHER_ROLE`（`lib/auth-roles.ts`）將 catalogId 轉為書名。
- **文件**：`doc/老師手冊.md`（結業後填寫回饋）、`doc/管理者操作手冊.md`（會員詳情檢視回饋）、`config/version.json`、`README-AI.md`。
