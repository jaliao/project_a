## 1. 資料庫 Schema 變更

- [x] 1.1 在 `prisma/schema/course-invite.prisma` 的 `InviteEnrollment` 新增 `nonGraduateReason String?` 欄位
- [x] 1.2 執行 `make schema-update name=add_non_graduate_reason` 產生 migration

## 2. Server Action 更新

- [x] 2.1 更新 `app/actions/course-invite.ts` 的 `graduateCourse` 參數：改為接收 `lastCourseDate: Date` 與 `enrollmentResults: { userId: string; graduated: boolean; nonGraduateReason?: string }[]`
- [x] 2.2 更新 action 邏輯：以 `lastCourseDate` 設定 `CourseInvite.completedAt`
- [x] 2.3 更新 action 邏輯：未結業學員儲存 `nonGraduateReason`，並驗證 `graduated: false` 時原因為必填
- [x] 2.4 revalidatePath 補充 `/course/[id]/graduate`

## 3. 結業表單頁面

- [x] 3.1 建立 `app/(user)/course/[id]/graduate/page.tsx`（Server Component，驗證權限）
- [x] 3.2 建立 `app/(user)/course/[id]/graduate/graduation-form.tsx`（Client Component，三步驟狀態機）
- [x] 3.3 實作「填寫」步驟：最後一堂課程日期 input（type="date"）
- [x] 3.4 實作「填寫」步驟：學員清單，每位學員含結業 checkbox（預設勾選）
- [x] 3.5 實作「填寫」步驟：取消勾選時顯示未結業原因 Select（選項：時間不足、其他）
- [x] 3.6 實作「填寫」步驟：驗證邏輯（日期必填、未結業原因必填）
- [x] 3.7 實作「預覽」步驟：顯示最後課程日期、已結業名單、未結業名單（含原因）
- [x] 3.8 實作「預覽」步驟：「返回修改」按鈕（回到填寫步驟並保留資料）
- [x] 3.9 實作「送出」：呼叫 `graduateCourse` action，成功後 toast + 導回課程詳情頁

## 4. 課程詳情頁更新

- [x] 4.1 更新 `app/(user)/course/[id]/course-detail-actions.tsx`：結業按鈕改為 `<Link href={/course/${id}/graduate}>` 取代原有 Dialog 觸發
- [x] 4.2 移除 `app/(user)/course/[id]/graduation-dialog.tsx`（已被頁面取代）
