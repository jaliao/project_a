## 1. 管理後台頁面（/admin）

- [x] 1.1 新增 `app/(user)/admin/page.tsx`，將原 `dashboard/page.tsx` 的全部內容搬移至此
- [x] 1.2 確認 `/admin` 頁面功能正常（統計卡片、近期活動、已接受邀請學員、開課操作）

## 2. 學員專屬頁面（/user/[id]）

- [x] 2.1 新增 `app/(user)/user/[id]/page.tsx`（Server Component）
- [x] 2.2 查詢目標使用者資料：`realName`、`name`、`learningLevel`，不存在時回傳 `notFound()`
- [x] 2.3 查詢目標使用者的 `InviteEnrollment`（join `CourseInvite.courseLevel`）
- [x] 2.4 實作基本資料單元：顯示姓名（realName fallback name）
- [x] 2.5 實作身分標籤：依 learningLevel 顯示對應 Badge（0 則不顯示）
- [x] 2.6 實作已完成課程列表：依 courseLevel config 取得 label，無記錄時顯示「尚未完成任何課程」

## 3. 路由導向修改

- [x] 3.1 修改 `app/(user)/dashboard/page.tsx`：移除原有內容，改為 server-side `redirect('/user/${session.user.id}')`
- [x] 3.2 修改 `app/page.tsx`：呼叫 `auth()` 取得 session，已登入則 `redirect('/user/${session.user.id}')`，未登入則維持原行為（middleware 攔截）

## 4. 版本與文件

- [x] 4.1 更新 `config/version.json` patch 版本號 +1
- [x] 4.2 更新 `README-AI.md`
