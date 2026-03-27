## 1. Spec 補齊（已完成）

- [x] 1.1 更新 `student-profile-page` spec：URL 小寫、ProfileBanner、授課單元（含 /courses 連結）、管理者單元
- [x] 1.2 更新 `dashboard-home` spec：spiritId null redirect、/admin 移除個人功能單元
- [x] 1.3 新增 `user-courses` spec：`/user/{spiritId}/courses` 頁面規格
- [x] 1.4 新增 `design.md`：記錄 URL 小寫、isOwnPage、learningLevel 欄位等決策

## 2. 程式碼修正（已完成於 cr-spec-260324-013 後續修正）

- [x] 2.1 Spirit ID URL 小寫（redirect `.toLowerCase()`，查詢 `.toUpperCase()`）
- [x] 2.2 `/user/[id]` 新增 ProfileBanner（isOwnPage）
- [x] 2.3 `/user/[id]` 新增授課單元（isOwnPage）
- [x] 2.4 `/user/[id]` 新增管理者單元（isOwnPage && isAdmin）
- [x] 2.5 `/admin` 移除 ProfileBanner、授課單元、管理者單元
- [x] 2.6 redirect 邏輯：spiritId null → `/profile`
- [x] 2.7 `User.learningLevel Int @default(0)` schema + migration

## 3. 我的開課頁面（待實作）

- [x] 3.1 新增 `app/(user)/user/[spiritId]/courses/page.tsx`（Server Component）
- [x] 3.2 查詢當前使用者建立的 CourseInvite 列表，存取他人則 redirect 至本人 /courses
- [x] 3.3 以 CourseSessionCard（compact）顯示列表，無記錄時顯示空狀態
- [x] 3.4 頁面加入「返回學員頁面」連結（`/user/{spiritId}`）
- [x] 3.5 `/user/[id]` 授課單元的「開課查詢」連結改為 `/user/{spiritId}/courses`
- [x] 3.6 更新 `config/version.json` patch +1
- [x] 3.7 更新 `README-AI.md`
