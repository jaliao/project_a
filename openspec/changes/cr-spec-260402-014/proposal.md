## Why

Topbar 右上角缺少常用導覽入口（首頁、後台），使用者需自行記憶路由；通知 Drawer 標頭的「全部標為已讀」按鈕與 shadcn SheetContent 內建 X 關閉按鈕重疊，點擊困難。

## What Changes

- `components/layout/topbar.tsx`：新增「回首頁」按鈕（導向 `/user/{spiritId}`）與「後台管理」按鈕（導向 `/admin`，限 admin/superadmin 顯示）；`app/(user)/layout.tsx` 補傳 `role`/`spiritId` props
- `components/notification/notification-drawer.tsx`：重新排版 SheetHeader，讓「全部標為已讀」不與 shadcn 內建 X 按鈕（`absolute right-4 top-4`）重疊
- 個人資料頁從 `/profile` 遷移至 `/user/[spiritId]/profile`；Topbar 個人資料按鈕、`profile-banner`、`change-password` 等所有參照一併更新

## Capabilities

### New Capabilities
- `topbar-nav`: Topbar 新增回首頁與後台管理按鈕（依 role 條件渲染）
- `notification-header-fix`: 修正通知 Drawer 標頭按鈕重疊問題
- `profile-route-move`: 個人資料頁路由從 `/profile` 遷移至 `/user/[spiritId]/profile`

### Modified Capabilities

## Impact

- `components/layout/topbar.tsx` — 新增 props、新增導覽按鈕、個人資料連結改為 `/user/{spiritId}/profile`
- `app/(user)/layout.tsx` — 補傳 `role` / `spiritId`
- `components/notification/notification-drawer.tsx` — 調整 SheetHeader 排版
- `app/(user)/profile/` → 移至 `app/(user)/user/[spiritId]/profile/`
- `components/dashboard/profile-banner.tsx` — 連結更新
- `app/change-password/page.tsx` — 跳轉路徑更新
- `app/(user)/profile/profile-form.tsx` — Google OAuth callbackUrl 更新
