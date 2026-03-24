## 1. 資料庫 Schema 變更

- [x] 1.1 在 `prisma/schema/course-invite.prisma` 新增 `EnrollmentStatus` enum（pending | approved）
- [x] 1.2 在 `prisma/schema/course-invite.prisma` 新增 `MaterialChoice` enum（none | traditional | simplified）
- [x] 1.3 `InviteEnrollment` 新增 `status EnrollmentStatus @default(pending)` 欄位
- [x] 1.4 `InviteEnrollment` 新增 `materialChoice MaterialChoice @default(none)` 欄位
- [x] 1.5 `CourseInvite` 新增 `completedAt DateTime?` 欄位
- [x] 1.6 執行 `make schema-update name=add_enrollment_status_material_graduation`
- [x] 1.7 手動補充 migration SQL：`UPDATE invite_enrollments SET status = 'approved'`（現有資料設為已核准）

## 2. 修改現有 Action

- [x] 2.1 修改 `app/actions/course-invite.ts` 的 `joinInvite` — 建立 InviteEnrollment 時帶入 `status: 'pending'`，暫不帶 materialChoice（在課程頁完成選購）
- [x] 2.2 說明：學員透過邀請連結到達 `/invite/[token]`，系統建立 pending 申請後 redirect 至 `/course/${invite.id}` 而非 `/dashboard?enrolled=1`

## 3. 新增 Server Actions

- [x] 3.1 新增 `applyToCourse(inviteId, materialChoice)` — 建立 InviteEnrollment（status=pending），僅限未有記錄、未截止的課程
- [x] 3.2 新增 `approveEnrollment(enrollmentId)` — 驗證講師身分，將 status 改為 approved，revalidatePath
- [x] 3.3 新增 `graduateCourse(inviteId)` — 驗證講師身分，寫入 completedAt = now()，revalidatePath

## 4. 修改資料存取層

- [x] 4.1 修改 `lib/data/course-sessions.ts` 的 `getCourseSessionById`，enrollments include 加入 `status`、`materialChoice`
- [x] 4.2 在 `getCourseSessionById` 回傳中分離 `approvedEnrollments`（status=approved）與 `pendingEnrollments`（status=pending）

## 5. 新增學員申請 Dialog 元件

- [x] 5.1 新增 `components/course-session/enrollment-application-dialog.tsx`（Client Component）
- [x] 5.2 實作三選一的書籍選項（無須購買 / 繁體教材 / 簡體教材），Radio 或 Card 選擇
- [x] 5.3 送出呼叫 `applyToCourse` action，顯示成功/失敗 toast

## 6. 重新設計課程詳情頁

- [x] 6.1 修改 `app/(user)/course/[id]/page.tsx`，新增「基本資訊區塊」（開課內容、日期、截止日、授課老師）
- [x] 6.2 課程狀態標籤：已取消（紅）、已結業（綠）、進行中（無標籤）
- [x] 6.3 學員視圖：依據是否為講師（session.user.id === createdBy.id）分叉渲染
- [x] 6.4 學員視圖：顯示申請狀態按鈕（申請參加 / 申請審核中 / 已加入 / 報名截止）
- [x] 6.5 講師視圖：顯示「待審申請」區塊（pending 清單 + 同意按鈕）
- [x] 6.6 講師視圖：已核准學員清單顯示 materialChoice 標籤
- [x] 6.7 講師視圖：顯示「複製邀請連結」按鈕（使用 Clipboard API）

## 7. 修改操作按鈕元件

- [x] 7.1 修改 `app/(user)/course/[id]/course-detail-actions.tsx`，加入「結業」按鈕（講師且未結業未取消才顯示）
- [x] 7.2 結業按鈕點擊彈出確認 Dialog，確認後呼叫 `graduateCourse` action
- [x] 7.3 「同意」按鈕（在待審清單中）點擊後呼叫 `approveEnrollment` action

## 8. 版本與文件更新

- [x] 8.1 更新 `config/version.json` patch 版本號 +1
- [x] 8.2 更新 `README-AI.md` 反映資料模型變更、新 actions、頁面角色差異化
