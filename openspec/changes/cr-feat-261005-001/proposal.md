## Why

2026-10-05 排查「刪除會員失敗」（PA260267）時發現：若會員具講師身分且曾建立班級（`CourseInvite`），班級底下只要還有其他學員的報名記錄（`InviteEnrollment`），`deleteMember` 就會被資料庫外鍵（`invite_enrollments_inviteId_fkey`，`ON DELETE RESTRICT`）擋下（已在 `cr-fix-261005-001` 補上明確錯誤訊息）。目前系統**完全沒有機制**可以把這些班級轉移給其他老師接手——這是講師帳號無法被刪除、也無法正常交接的根因。

後台會員詳情頁「授課紀錄」區塊（`app/[locale]/(admin)/admin/members/[id]/page.tsx:224-251`）已經會列出該會員建立的所有班級，但目前完全沒有任何操作按鈕。

## What Changes

- 「授課紀錄」區塊新增「轉移班級」按鈕（`member.courseInvites.length > 0` 時顯示）。點擊開啟 Dialog：以勾選清單列出該會員名下所有班級（預設全選，管理者可取消勾選排除特定班級），搭配「選擇目標老師」欄位（重用 `StudentPicker` 元件殼，另寫 `searchTeacherCandidates` 查詢邏輯），確認後呼叫新 Server Action `transferCourseInvites(fromUserId, toUserId, inviteIds)` 批次把勾選班級的 `CourseInvite.createdById` 改成目標老師。
- 目標老師資格驗證：依勾選班級涵蓋的 `courseCatalogId` 轉成對應書籍講師身分（`TEACHER_ROLE_BY_CATALOG`），用 `hasRole()` 嚴格檢查目標老師**實際持有**該身分——**不套用管理者 override**（沿用 `app/actions/course-session.ts:73-98`「代講師開課」既有的驗證模式，與 `canTeachBook()` 的 admin override 語意區分開來）。任一班級所需身分目標老師未持有，整批拒絕並列出缺少的書籍名稱。
- 轉移動作於單一 `$transaction` 內完成，且**逐一班級**各寫一筆 `AdminActionLog`（`action = 'course_invite_transfer'`，新增至 `config/admin-log-action.ts`）——因 `AdminActionLog.inviteId` 是單一 FK、無陣列/JSON 欄位，沿用專案既有「一筆操作對應一筆 log」慣例，不堆疊在一筆 log 裡。
- `transferCourseInvites` 僅限管理者操作（`canAccessAdmin`），不開放老師本人自行轉移（符合「管理者可選來源老師、目標老師」的需求描述）。

### 排除範圍

- 不含「自動建議目標老師」或「批次匯入轉移」等進階功能。
- 不自動把 `cr-fix-261005-001` 的 `FK_RESTRICT_MESSAGES['course_invites_createdById_fkey' / 'invite_enrollments_inviteId_fkey']` 訊息內容改寫成「請使用轉移班級功能」之類的導引文字——訊息內容調整留給之後視需要再開 CR，本次純粹是把「轉移」這個操作做出來。
- 不處理 `CourseInvite` 以外的其他講師相關資料（例如 `teacherNo`）的轉移或重新指派。

## Capabilities

### Modified Capabilities
- `admin-member-management`：新增「班級轉移」需求（會員詳情頁授課紀錄區塊）

## Impact

- **程式碼**：
  - `app/actions/admin.ts`：新增 `transferCourseInvites`
  - `lib/data/teacher-picker.ts`（新檔）：`searchTeacherCandidates`
  - `lib/data/members.ts`：`getMemberDetail` 的 `courseInvites` select 已含 Dialog 所需欄位（`id/title/courseCatalogId/courseCatalog.label/_count.enrollments`），不需額外補欄位
  - `config/admin-log-action.ts`：新增 `course_invite_transfer` 動作定義
  - `components/admin/member-course-invite-transfer.tsx`（新檔，client component）
  - `app/[locale]/(admin)/admin/members/[id]/page.tsx`：掛載新按鈕/Dialog
- 無 Prisma schema／migration 變更（`CourseInvite.createdById` 欄位已存在，只是改寫入值）
- 無新增 i18n key（沿用既有 `ActionResponse.message` 直寫繁中字串慣例，與 `cr-fix-261005-001` 一致）
