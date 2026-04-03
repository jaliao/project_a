## 1. Topbar 導覽按鈕

- [x] 1.1 `app/(user)/layout.tsx`：從 session 取得 `role`/`spiritId`，補傳給 `<Topbar>`
- [x] 1.2 `components/layout/topbar.tsx`：新增 `role` / `spiritId` props，加入「回首頁」按鈕（→ `/user/{spiritId}`）
- [x] 1.3 `components/layout/topbar.tsx`：加入「後台管理」按鈕（→ `/admin`），僅 admin/superadmin 顯示

## 2. 修正通知 Drawer 標頭重疊

- [x] 2.1 `components/notification/notification-drawer.tsx`：SheetHeader 加 `pr-10`，確保「全部標為已讀」與內建 X 按鈕不重疊

## 3. 個人資料路由遷移

- [x] 3.1 新增 `app/(user)/user/[spiritId]/profile/page.tsx`（從舊 `app/(user)/profile/page.tsx` 複製內容）
- [x] 3.2 新增 `app/(user)/user/[spiritId]/profile/profile-form.tsx`（從舊 `app/(user)/profile/profile-form.tsx` 複製，Google OAuth callbackUrl 改為動態取得 `/user/{spiritId}/profile`）
- [x] 3.3 舊 `app/(user)/profile/page.tsx` 改為 server redirect → `/user/{spiritId}/profile`（讀 session）
- [x] 3.4 `components/layout/topbar.tsx`：個人資料按鈕導向 `/user/{spiritId}/profile`
- [x] 3.5 `components/dashboard/profile-banner.tsx`：「完善個人資料」連結更新（需從 props 或 session 取得 spiritId）
- [x] 3.6 `app/change-password/page.tsx`：密碼修改後改導向 `/user/{spiritId}/profile`（從 session 取得）

## 4. 版本與文件

- [x] 4.1 `config/version.json` patch 版本號 +1
- [x] 4.2 依 `.ai-rules.md` 更新 `README-AI.md`
