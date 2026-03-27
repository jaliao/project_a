## 1. DB Schema 更新

- [x] 1.1 在 `prisma/schema/course-invite.prisma` 的 `CourseInvite` 模型新增 `courseDate String?` 與 `notes String?` 欄位
- [x] 1.2 執行 `make schema-update name=add_course_invite_date_notes` 產生 migration 並重新產生 Prisma client

## 2. 更新 Zod Schema

- [x] 2.1 重寫 `lib/schemas/course-session.ts`：移除所有訂購欄位（buyerNameZh、buyerNameEn、teacherName、churchOrg、email、phone、materialVersion、purchaseType、studentNames、quantityOption、quantityNote、taxId、deliveryMethod）；新增 `title`（必填）、`notes`（選填）；保留 courseLevel、maxCount、expiredAt、courseDate

## 3. 更新 Server Action

- [x] 3.1 重寫 `app/actions/course-session.ts` 的 `createCourseSession`：移除 CourseOrder.create 與 transaction，直接 `prisma.courseInvite.create`，傳入 title、courseDate（格式化字串）、notes

## 4. 更新 Data Layer

- [x] 4.1 更新 `lib/data/course-sessions.ts` 的 `getMyCourseSessions`：select 新增 `courseDate`；回傳時改為 `invite.courseDate ?? invite.courseOrder?.courseDate ?? null`

## 5. 更新 CourseSessionDialog

- [x] 5.1 在 `components/course-session/course-session-dialog.tsx` 新增 `instructorName: string` prop，傳入 CourseSessionForm；按鈕文字改為「新增授課」；DialogTitle 改為「新增授課」

## 6. 重寫 CourseSessionForm

- [x] 6.1 重寫 `components/course-session/course-session-form.tsx`：移除所有訂購欄位 UI 及相關 watch 邏輯；新增 `instructorName` prop
- [x] 6.2 新增課程名稱欄位（必填）：監聽 courseLevel 變化，以 `useRef` isDirty flag 控制是否自動更新預設值 `{instructorName} 的 {courseLabel}`；使用者手動修改後停止自動覆蓋
- [x] 6.3 新增備註欄位（非必填 Textarea）
- [x] 6.4 更新 DEV_DEFAULTS 為新 schema 欄位（courseLevel、title、maxCount、expiredAt、courseDate、notes）

## 7. 更新首頁授課單元

- [x] 7.1 在 `app/(user)/user/[spiritId]/page.tsx` 呼叫 `getMyCourseSessions(user.id, 4)` 取得最多 4 筆授課（僅本人頁面）
- [x] 7.2 授課單元先顯示課程卡片（前 3 筆），再顯示「新增授課」按鈕；若有第 4 筆則在卡片最後加一張「更多授課資訊」卡片（`<Link href={/user/${id}/courses}>` 包裹，border + 文字置中）
- [x] 7.3 將 `CourseSessionDialog` 傳入 `instructorName={displayName}`

## 8. 版本與文件更新

- [x] 8.1 更新 `config/version.json` patch 版本號 +1
- [x] 8.2 依規範更新 `README-AI.md`
