## Context

正式環境 `course_invites` 表目前 432 筆中，345 筆是 2026-07-03 由 `prisma/seed.ts` 的歷史班表匯入（`roster.json`）一次性批次建立，屬真實歷史開課紀錄，**不在本次變更處理範圍**（使用者已確認）。另有 11 筆標題含「（補建）」，是各講師／管理者於 2026-07-09～07-21 手動用一般「新增課程」功能建立的補登紀錄，其中 6 筆從未加入報名（廢棄/誤觸）、5 筆已有真實學員報名並結業（有效紀錄）。

系統目前對 `CourseInvite` 的生命週期操作（取消、重新招募、結業回退，見 `cancel-course-session` capability）皆守衛為「該課建立者或 `canAccessAdmin`」，且都是「狀態轉換」而非「移除」。目前唯一能移除 `CourseInvite` 的路徑是 `app/actions/admin.ts` 的 `deleteMember`（刪除整個會員帳號時，於交易內先 `inviteEnrollment.deleteMany` 再 `courseInvite.deleteMany({ where: { createdById: userId } })`）——這證實 `InviteEnrollment → CourseInvite` 的 FK 未設 cascade，刪除課程前必須先手動清空報名。

## Goals / Non-Goals

**Goals:**
- 讓管理者能對單一課程執行「封存」（可逆、不刪資料，僅從預設清單隱藏）與「刪除」（不可逆、真正移除）。
- 封存／刪除僅開放 `admin`／`superadmin`（不含一般講師），與現有「取消課程」等操作的守衛範圍區隔。
- 開課管理清單預設不顯示已封存課程，但可透過篩選調出。

**Non-Goals:**
- 不處理 345 筆 seed 匯入的歷史紀錄，也不在本次變更中為 `prisma/seed.ts` 加上正式環境防呆（使用者已確認為另一個獨立議題，不併入本 CR）。
- 不新增「批次刪除／批次封存」介面；每次操作僅針對單一課程，比照既有取消/重新招募等操作的單筆設計。
- 不變更 `cancelledAt`（取消課程）既有語意；封存與取消是兩個獨立正交的狀態（詳見 Decisions）。
- 不處理刪除課程後對證書資格（`CertificateProduction`）既有已產生證書的回溯處理——證書關聯的是 `CourseCatalog` 而非 `CourseInvite`，刪除課程不會自動撤銷已產生的證書；此為確認視窗需明確警示的風險，非程式自動處理範圍。

## Decisions

1. **封存採新欄位 `archivedAt`／`archiveReason`，不重用 `cancelledAt`**
   `cancelledAt` 語意是「課程本身被取消」（會出現在取消原因下拉、影響學員報名流程認知），封存的語意是「這筆紀錄不該再出現在管理清單，但資料本身正確或需保留」——兩者觸發情境與對外語意不同（取消可能仍需保留在列表供追溯；封存則是主動從列表移除雜訊）。用獨立欄位可讓「已取消但未封存」「已封存但未取消」兩種狀態並存，例如：一筆已取消的課程之後若確認不再需要出現在清單，管理者仍可將其封存。

2. **封存為軟操作、可逆；刪除為硬操作、不可逆，兩者皆不限制課程狀態**
   不論課程處於招生中／進行中／已結業／已取消，皆可封存或刪除——與既有「取消」「重新招募」「結業回退」不同（那些操作綁定特定前置狀態），因為封存/刪除的目的是「管理清單雜訊」，不是「課程生命週期推進」，若限制前置狀態反而會讓管理者無法清理已結業或已取消的錯誤紀錄。
   刪除**不**依「有無報名資料」設限（不強制只能刪空課程）：現有 `deleteMember` 已允許在刪除整個帳號時連帶刪除有報名的課程，本次不新增比既有更嚴格的限制；改以確認視窗清楚列出即將刪除的報名筆數與結業人數作為防呆。

3. **刪除交易內僅需手動清空 `InviteEnrollment`，其餘關聯皆由資料庫 FK 自動處理**
   查核 migration 歷史確認實際 FK 行為：`invite_enrollments_inviteId_fkey` 為 `ON DELETE RESTRICT`（必須先於交易內 `deleteMany` 清空該課全部 `InviteEnrollment`，否則刪除 `CourseInvite` 會被資料庫拒絕，比照 `deleteMember` 既有模式）；`material_shipment_items_enrollmentId_fkey` 已於 `20260720031357_material_apply_editable` 改為 `ON DELETE SET NULL`（刪除 `InviteEnrollment` 時自動設 null，**不需**額外手動清理）；`course_orders_courseInviteId_fkey` 為 `ON DELETE SET NULL`（**不需**額外處理）；`CourseMessage` 已設 `onDelete: Cascade` 會自動隨課程刪除；`AdminActionLog.inviteId`／`SupportInquiry.courseInviteId`／`LearningRecordFeedback.resultInviteId` 皆為 `onDelete: SetNull`，紀錄本身以文字快照保留、不受影響。交易內僅需：`inviteEnrollment.deleteMany({ where: { inviteId } })` → `courseInvite.delete({ where: { id: inviteId } })`。

4. **封存／刪除的權限守衛為 `canAccessAdmin`，不含「該課建立者」**
   與取消/重新招募/結業回退（該課建立者或管理者皆可）不同——封存與刪除影響的是後台資料治理範疇，比照使用者確認的「僅 admin 與 superadmin 可操作」，一般講師（`teacher_*` 身分但非 `admin`/`superadmin`）即使是該課建立者也不可封存或刪除自己建立的課程，避免誤刪歷史資料。

5. **已封存課程從所有非「已封存」篩選中排除，僅選擇「已封存」時才顯示**
   `getAllCourseSessionsAdmin`（`lib/data/course-sessions.ts`）目前 `status` 篩選支援 `recruiting`/`started`/`completed`/`cancelled`；新增 `archived` 選項。規則統一為：`status !== 'archived'` 時（含未指定篩選、以及 `recruiting`/`started`/`completed`/`cancelled` 四個既有選項），一律於 where 條件加上 `archivedAt: null`；僅 `status === 'archived'` 時顯示 `archivedAt` 不為 null 的課程。避免已封存課程混雜出現在其他狀態篩選結果中。

## Risks / Trade-offs

- **[風險] 刪除為不可逆操作，若管理者誤刪有真實學員報名的課程，資料無法復原** → 緩解：確認 Dialog 需明確列出報名人數與結業人數（比照「結業回退」確認視窗提示重複寄信風險的既有慣例），且刪除守衛限縮在 `admin`/`superadmin`，較一般講師更謹慎的角色。
- **[風險] 封存後课程從預設清單消失，若管理者忘記如何調出會誤以為資料遺失** → 緩解：篩選選單「已封存」為常駐可見選項，非隱藏功能。
- **[風險，已於實作階段查核並解除] `CourseOrder.courseInviteId` 實際 FK 刪除行為** → 已於實作 task 1.3 查核 migration 歷史確認為 `ON DELETE SET NULL`，無需額外處理。

## Migration Plan

1. `prisma/schema/course-invite.prisma` 新增 `archivedAt DateTime?`／`archiveReason String?`，`make schema-update` 建立 migration。
2. `app/actions/course-session.ts` 新增 `archiveCourseSession`／`unarchiveCourseSession`／`deleteCourseSession` 三個 Server Action，皆以 `canAccessAdmin` 守衛。
3. 新增封存／刪除確認 Dialog 元件並整合進課程詳情頁管理操作區塊。
4. `lib/data/course-sessions.ts` 調整清單查詢（新增 `archived` 狀態、預設排除已封存）；`course-sessions-filter.tsx` 新增選項。
5. `npm run lint` + `npm run build`。
6. 依 CLAUDE.md 規範同步 `doc/管理者操作手冊.md`（與視情況同步其他手冊）、`config/version.json` patch 版號。

**Rollback：** Server Action／UI 為純程式碼變更可直接 revert；新增欄位的 migration 若需回退，因欄位皆為選填（nullable）且無既有欄位重複利用，回退 migration 不影響其他既有資料。
