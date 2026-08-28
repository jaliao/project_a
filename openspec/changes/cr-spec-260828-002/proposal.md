## Why

需求單 CR-SPEC-260828-002（提出人：廖柏嘉 Justin，2026-08-28）：

> 管理者可以在講師的頁面幫老師新增授課。順便盤點這個頁面有哪些功能是講師可以、管理者不行。我需要評估是否讓管理者和老師都有一樣的權限？

決策（2026-08-28 與提出人確認）：

1. **代新增授課**：管理者於講師的個人頁（`/user/[spiritId]`）代該老師新增授課；可選書別**僅限該老師已持有的書籍講師身分**。
2. **權限對齊**：管理者在課程相關頁面全面對齊「該課講師」的操作權限（下方盤點表逐項放寬）。

> ⚠️ 2026-08-28 更新：課程 FAQ 功能已於 CR-SPEC-260828-004 自系統整包移除（`course-faq` spec、`course-message` action/data/schema、`CourseFaq` 元件皆已刪除）。原盤點含的三項 FAQ 對齊項目已從本變更移除，不再納入範圍。

### 盤點：課程頁「講師可以、管理者不行」的功能

現況以 `isInstructor`（`CourseInvite.createdById === 當前使用者`）判定，管理者被擋：

| 功能 | 現況 UI 守衛 | server action 守衛 |
|---|---|---|
| 審核待審報名申請（「同意」） | 僅該課講師 | `approveEnrollment`：`createdById !== user` 即回「無權限」 |
| 開始上課（招生中 → 進行中） | 僅該課講師 | `startCourseSession`：同上 |
| 講師資格回饋（對已結業學員推薦成為講師） | 僅該課講師 | `upsertInstructorFeedback`：同上 |
| 複製邀請連結 | 僅該課講師 | （純前端） |
| 公開媒合設定（開關＋招募備註） | UI 僅該課講師 | `updateMatchSettings`：**已允許** owner 或 admin |

已是「該課講師或管理者」、本次不需變更：編輯課程資訊、已核准學員新增／移除、教材申請作業、結業作業、重新招募、結業回退、取消授課、課程操作 LOG。

### 刻意維持不對齊（不在本次「對齊」範圍）

- **封存／刪除課程**：維持僅 `admin`／`superadmin`。此為管理者專屬能力、講師本就不可；「對齊」方向是管理者取得該課講師的能力，非反向賦予講師。
- **課程頁「聯繫管理者」按鈕**（`CourseContactAdminButton`）：語意為講師向管理者求助的管道，管理者對自身送出無意義，維持講師專屬。
- **代新增授課入口**只出現在「具任一書籍講師身分（`teacher_1`／`teacher_2`／`teacher_3`）」之會員的 `/user/[spiritId]` 頁；不提供「替非講師建立授課」。

## What Changes

### 1. 管理者代講師新增授課

- `/user/[spiritId]` 頁「授課」區塊：當**檢視者為管理者、且頁主具任一書籍講師身分**時，即使非本人頁亦顯示「新增授課」按鈕與該老師的近期授課預覽。
- 沿用既有 `CourseSessionDialog` → `CreateCourseWizard`，新增「代建立」模式（`onBehalfOfUserId` / `onBehalfOfName`）：
  - 精靈標題與「授課老師」顯示為**頁主（該老師）**姓名。
  - 可選課程（書別）**僅限頁主已持有的書籍講師身分**（`teacher_1→啟動靈人`、`teacher_2→啟動豐盛`、`teacher_3→啟動得勝`）對應之啟用中課程；頁主無任何 `teacher_*` 身分時不顯示入口。
- `createCourseSession` server action 新增選填 `targetTeacherId`：
  - 帶入時**權威驗證**：操作者須 `canAccessAdmin`；目標會員須實際持有該書 `TEACHER_ROLE_BY_CATALOG[courseCatalogId]` 對應身分（**不套用管理者 override**）。
  - 通過後以**目標會員**為 `CourseInvite.createdById`；「授課已建立」Inbox 通知寄給該老師。
  - 人數上限比照管理者放寬（操作者為管理者）。
- `courseSessionSchema` 新增選填 `targetTeacherId`（UUID）。

### 2. 課程頁（`/course/[id]`）操作權限對齊

下列由「該課講師」放寬為「該課講師**或**管理者」，UI 與 server action 一致：

- 待審報名申請清單與「同意」（`approveEnrollment`）。
- 開始上課作業（`startCourseSession`）；**開課門檻條件不變**（≥1 已核准學員＋教材需求已處理＋教材已收件）。
- 講師資格回饋（`upsertInstructorFeedback`）；對象仍限**已結業**學員。
- 公開媒合設定編輯器（`MatchSettingsEditor`）對管理者顯示（server action 已放行）。
- 複製邀請連結按鈕對管理者顯示。

管理者代為執行的操作，其 Inbox 通知（如取消課程、授課已建立）SHALL 寄給該課講師（`createdById`），而非操作的管理者本人。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities

- `create-course-session`：新增「管理者代講師建立授課」需求。
- `instructor-enrollment-review`：待審申請清單與「同意」權限由該課講師放寬為該課講師或管理者。
- `instructor-feedback`：講師資格回饋填寫權限由該課建立者放寬為該課建立者或管理者。
- `course-session-detail`：多個「講師專屬」區塊（複製邀請連結、開始上課、公開媒合設定）改為「該課講師或管理者」。

## Impact

- **Affected code**
  - `lib/schemas/course-session.ts`：`courseSessionSchema` 新增選填 `targetTeacherId`。
  - `app/actions/course-session.ts`：`createCourseSession` 支援 `targetTeacherId`（代建立分支＋權威驗證＋通知收件人）。
  - `app/actions/course-invite.ts`：`approveEnrollment`、`startCourseSession`、`upsertInstructorFeedback` 守衛放寬為 `createdById === user || canAccessAdmin(user.roles)`；相關通知收件人改為 `createdById`。
  - `app/[locale]/(user)/course/[id]/page.tsx`：`PendingEnrollmentList`、`InstructorFeedbackButton`、`MatchSettingsEditor`、`CopyInviteLinkButton` 的顯示條件、`CourseDetailActions` 開始上課區塊 gate。
  - `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：開始上課區塊改用「該課講師或管理者」判定。
  - `app/[locale]/(user)/user/[spiritId]/page.tsx`：「授課」區塊新增管理者代建立分支（顯示條件、`teachableCatalogIds` 取自頁主身分、傳 `onBehalfOf` 給 Dialog）。
  - `components/course-session/course-session-dialog.tsx`、`components/course-session/create-course-wizard/*`：on-behalf 模式（新增選填 prop，透傳 `targetTeacherId`）。
- **Database**：無 schema 變更（沿用 `CourseInvite.createdById`）。
- **i18n**（CLAUDE.md #12）：代建立提示、空狀態等新字串加入 `messages/zh-TW.json` 與 `messages/en.json`；`zh-CN` 由 `npm run gen:zh-cn` 產生。
- **Docs**（CLAUDE.md #9）：`doc/老師手冊.md`、`doc/管理者操作手冊.md` 補「管理者可於講師頁代新增授課」「管理者於課程頁可審核報名／開始上課／填寫講師資格回饋」；各檔檔首版本與日期更新。
- **Version**（CLAUDE.md #7）：apply 時 `config/version.json` patch +1、`updatedAt` 更新為當日。
- **Dependencies**：無新增套件。
