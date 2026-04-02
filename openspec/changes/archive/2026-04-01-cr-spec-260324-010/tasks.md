## 1. 後台首頁改版

- [x] 1.1 重寫 `app/(user)/admin/page.tsx`：移除所有舊內容（StatsCard、RecentMembers、EnrolledStudentsList、CourseSessionCard 預覽、DashboardActions、所有 prisma 查詢），改為功能按鈕網格
- [x] 1.2 功能按鈕共五個：儀錶板（disabled + 「待開發」標示）、課程管理（`/admin/course-catalog`）、授課管理（`/course-sessions`）、教材作業（`/admin/materials`）、會員管理（`/admin/members`）

## 2. 會員管理頁

- [x] 2.1 新增 `app/(user)/admin/members/page.tsx`：Server Component，查詢所有 User（依 createdAt desc），非管理者導向 `/`
- [x] 2.2 新增 `components/admin/member-reset-button.tsx`：Client Component，含確認 dialog，點擊確認後呼叫 `resetMemberPassword(userId)`
- [x] 2.3 新增 `app/actions/admin.ts`：實作 `resetMemberPassword(userId)` — 生成臨時密碼、bcrypt hash、更新 DB、fire-and-forget 寄信

## 3. 版本與文件更新

- [x] 3.1 將 `config/version.json` patch 版本號 +1
- [x] 3.2 更新 `README-AI.md` 版本號
