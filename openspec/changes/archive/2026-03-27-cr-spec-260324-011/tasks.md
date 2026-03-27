## 1. 資料庫 Schema 變更

- [x] 1.1 修改 `prisma/schema/course-invite.prisma`，新增 `cancelledAt DateTime?` 與 `cancelReason String?` 欄位
- [x] 1.2 執行 `make schema-update name=add_course_cancel_fields` 產生並套用 migration
- [x] 1.3 確認 `prisma/generated` 重新產生，型別正確

## 2. 資料存取層

- [x] 2.1 在 `lib/data/course-sessions.ts` 新增 `getCourseSessionById(id: number)` 函式，include `createdBy`（User）與 `enrollments`（InviteEnrollment + User）

## 3. Server Action

- [x] 3.1 新增 `app/actions/course-invite.ts`，實作 `cancelCourseSession(id, cancelReason)` action
- [x] 3.2 action 驗證 session → 確認為課程建立者 → 寫入 `cancelledAt`、`cancelReason` → `revalidatePath('/course/[id]')`

## 4. 取消課程 Dialog 元件

- [x] 4.1 新增 `components/course-session/cancel-course-dialog.tsx`（Client Component）
- [x] 4.2 實作下拉選單（人數不足、時間因素、其他）
- [x] 4.3 選擇「其他」時顯示 textarea，並驗證非空
- [x] 4.4 送出後呼叫 `cancelCourseSession` action，顯示成功/失敗 toast

## 5. 課程詳情頁

- [x] 5.1 新增目錄 `app/(user)/course/[id]/`
- [x] 5.2 新增 `app/(user)/course/[id]/page.tsx`（Server Component），呼叫 `getCourseSessionById`
- [x] 5.3 顯示授課老師姓名與 Email
- [x] 5.4 顯示已接受學員名單（name、email、joinedAt），無學員時顯示空狀態
- [x] 5.5 `cancelledAt` 不為 null 時顯示「已取消」標籤與取消原因
- [x] 5.6 未取消時顯示「取消課程」按鈕，已取消時隱藏；載入 `CancelCourseDialog`
- [x] 5.7 新增「結業申請」按鈕（disabled 狀態，顯示「功能即將開放」tooltip 或 toast）

## 6. 修改課程卡片元件

- [x] 6.1 修改 `components/course-session/course-session-card.tsx`，新增可選 `href` prop
- [x] 6.2 當 `href` 有值時，以 Next.js `Link` 包裹卡片，使整張卡片可點擊

## 7. 傳入卡片連結

- [x] 7.1 修改 Dashboard 開課預覽列表，傳入 `href={/course/${invite.id}}` 給每張 `CourseSessionCard`
- [x] 7.2 修改 `/course-sessions` 查詢頁，傳入 `href={/course/${invite.id}}` 給每張 `CourseSessionCard`

## 8. 版本與文件更新

- [x] 8.1 更新 `config/version.json` patch 版本號 +1
- [x] 8.2 更新 `README-AI.md` 反映新路由、資料模型與功能
