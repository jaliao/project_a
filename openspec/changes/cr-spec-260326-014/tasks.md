## 1. 資料庫 Schema 變更

- [x] 1.1 `prisma/schema/course-invite.prisma` 的 `InviteEnrollment` 新增 `graduatedAt DateTime?` 欄位
- [x] 1.2 執行 `make schema-update name=add_graduation_to_enrollment`

## 2. 更新 Server Action

- [x] 2.1 修改 `graduateCourse(inviteId, graduatedUserIds: string[])` 簽名，接收通過學員 ID 清單
- [x] 2.2 `graduateCourse()` 批次 update 被勾選學員的 `InviteEnrollment.graduatedAt = new Date()`
- [x] 2.3 驗證：`graduatedUserIds` 不可為空陣列，否則回傳錯誤
- [x] 2.4 驗證：僅 `status = approved` 的學員 ID 才允許寫入 `graduatedAt`

## 3. 結業 Dialog（前端）

- [x] 3.1 新增 `app/(user)/course/[id]/graduation-dialog.tsx` client component，列出已核准學員供勾選
- [x] 3.2 `graduation-dialog.tsx` 預設全選所有已核准學員
- [x] 3.3 `graduation-dialog.tsx` 未勾選任何學員時「確認結業」按鈕顯示錯誤提示
- [x] 3.4 修改 `app/(user)/course/[id]/course-detail-actions.tsx`：「結業」按鈕改為開啟 `GraduationDialog`，傳入已核准學員清單
- [x] 3.5 課程無已核准學員時「結業」按鈕 disabled 並顯示 tooltip

## 4. 分享按鈕

- [x] 4.1 修改 `app/(user)/course/[id]/copy-invite-link-button.tsx`：按鈕文字改為「分享」，點擊時優先呼叫 `navigator.share`，不支援時 fallback 複製連結
- [x] 4.2 修改 `components/course-invite/invite-copy-button.tsx`：同上，Web Share API + clipboard fallback
- [x] 4.3 修改 `components/course-invite/create-invite-form.tsx`：複製連結 View 的按鈕文字改為「分享」，套用相同邏輯

## 5. 結業證明資料查詢

- [x] 5.1 在 `lib/data/course-sessions.ts` 新增 `getMyCompletionCertificates(userId)` 函式，查詢 `InviteEnrollment` where `graduatedAt IS NOT NULL`，以 `courseLevel` 去重取最新一筆，含 `invite.title`、`invite.courseLevel`、`invite.createdBy`（realName/name）、`graduatedAt`
- [x] 5.2 更新 `getCourseSessionById()` 回傳的 `EnrollmentRecord` 型別加入 `graduatedAt: Date | null`
- [x] 5.3 更新 `getCourseSessionById()` 查詢中 `enrollments` select 加入 `graduatedAt`

## 6. 結業證明卡片元件

- [x] 6.1 新增 `components/course-invite/completion-certificate-card.tsx`，顯示課程名稱、課程等級、授課教師、結業日期

## 7. 學員頁面更新

- [x] 7.1 `app/(user)/user/[spiritId]/page.tsx` 呼叫 `getMyCompletionCertificates()` 取結業證明資料
- [x] 7.2 學員頁面新增「結業證明」區塊，列出 `CompletionCertificateCard`，無資料時隱藏區塊
- [x] 7.3 學員頁面新增「學習紀錄」預覽區塊，顯示最近 3 筆結業紀錄（課程名稱 + 結業日期）
- [x] 7.4 結業紀錄超過 3 筆時顯示「查看更多」連結至 `/learning`

## 8. 學習紀錄頁更新

- [x] 8.1 `app/(user)/learning/page.tsx` 查詢含 `graduatedAt` 的 enrollment 資料
- [x] 8.2 新增「結業紀錄」區塊，依 `graduatedAt` 降冪排列，顯示課程名稱、等級、授課教師、結業日期
- [x] 8.3 無結業紀錄時顯示空狀態提示

## 9. 驗證與收尾

- [x] 9.1 執行 `npm run build` 確認無型別錯誤
- [x] 9.2 更新 `config/version.json` patch 版本號 +1
- [x] 9.3 更新 `README-AI.md` 反映本次變更
