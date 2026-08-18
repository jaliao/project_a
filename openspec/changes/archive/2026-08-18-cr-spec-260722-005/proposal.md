## Why

CR 起因為正式環境後台出現「很多補建課程」。查核正式環境資料庫（`course_invites`）確認：標題含「補建」的紀錄共 11 筆，皆非程式自動產生，而是各講師／管理者於 2026-07-09～07-21 期間，透過現有的一般「新增課程」功能手動建立（標題沿用預設「{建立者} 的 {課程}」樣式，並自行加註「（補建）」），用途是補登學員遺失或錯誤的學習歷程。其中：

- 6 筆自建立後從未加入任何學員報名（`enrollments` 為 0），屬誤觸／重複嘗試後放棄的廢棄紀錄。
- 5 筆已有實際學員報名並標記結業，是真實有效的補登歷史紀錄，不可清除。

目前系統完全沒有刪除或封存課程的機制——唯一能移除 `CourseInvite` 的路徑是連同其建立者整個會員帳號一併刪除（`app/actions/admin.ts` 的 `deleteMember`）。這使得誤建／廢棄的補建課程只能永遠留在開課管理清單中，造成「後台出現很多補建課程」的觀感問題，也呼應原始需求「管理者可以刪除課程或是封存錯誤的課程」。

## What Changes

- 課程詳情頁（`app/[locale]/(user)/course/[id]/course-detail-actions.tsx`）新增「刪除課程」與「封存課程」兩個管理操作，**僅 `admin`／`superadmin` 可見與可執行**（與既有「取消課程」「重新招募」「結業回退」不同——那些是「該課建立者或管理者」皆可操作）。
- **封存（軟封存）**：`CourseInvite` 新增 `archivedAt`／`archiveReason` 欄位。封存後課程與其報名／教材等資料**完全保留**，僅從開課管理清單與相關使用者可見清單的預設檢視中隱藏；後台清單新增「已封存」篩選選項可重新查看。任何狀態的課程皆可封存，可重複解除。
- **刪除（硬刪）**：於單一交易內刪除該 `CourseInvite`（依既有 FK 設定，`CourseMessage` 隨之串聯刪除；`InviteEnrollment` 與其 `MaterialShipmentItem` 指派需先行清除；`AdminActionLog`／`SupportInquiry`／`LearningRecordFeedback.resultInviteId` 依現有 schema 設定為 SetNull，紀錄本身保留文字快照不受影響）。刪除為不可回復操作，確認視窗須明確列出將被永久移除的報名筆數，並警示若有已結業學員，其學習歷程／證書資格判斷資料將一併消失。
- 開課管理列表（`app/[locale]/(admin)/admin/course-sessions/page.tsx`）狀態篩選新增「已封存」選項；預設查詢排除已封存課程，降低清單雜訊。

## Capabilities

### New Capabilities
（無，擴充既有 capability）

### Modified Capabilities
- `admin-course-sessions`：新增「封存課程」「刪除課程」「開課管理清單封存篩選」需求。

## Impact

- **Affected code**：
  - `prisma/schema/course-invite.prisma`（新增 `archivedAt`／`archiveReason` 欄位 + migration）
  - `app/actions/course-session.ts`（新增 `archiveCourseSession` / `unarchiveCourseSession` / `deleteCourseSession` Server Actions）
  - `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`（新增封存／刪除操作區塊與確認 Dialog）
  - 新增 `components/course-session/archive-course-dialog.tsx`、`components/course-session/delete-course-dialog.tsx`（比照 `cancel-course-dialog.tsx` 樣式）
  - `lib/data/course-sessions.ts`（`getAllCourseSessionsAdmin` 狀態篩選加入 `archived`；預設排除已封存）
  - `app/[locale]/(admin)/admin/course-sessions/course-sessions-filter.tsx`（篩選選單新增「已封存」）
- **Database**：新增 migration（`archivedAt`／`archiveReason` 於 `course_invites`）；刪除課程為應用層交易操作，不涉及 schema 變更。
- **Docs**：依 CLAUDE.md 第 9 點，需同步檢查並更新 `doc/管理者操作手冊.md`（後台開課管理新增刪除／封存操作說明），`doc/老師手冊.md`／`doc/學員手冊.md` 視是否影響其可見清單而定。
- **Data cleanup（非本次程式變更範圍，另行執行）**：Spec 產生並上線後，管理者可用新功能手動清除正式環境中那 6 筆無報名的廢棄補建課程；5 筆有效補登紀錄保留不動。
- **Dependencies**：無新增套件。
