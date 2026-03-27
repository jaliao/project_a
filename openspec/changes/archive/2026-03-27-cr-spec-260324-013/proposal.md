## Why

目前系統缺乏學員個人專屬頁面，無法以單一路由呈現特定學員的基本資料與學習概況。此變更將建立 `/user/{id}` 作為啟動靈人學員專屬頁面，並將原 `/dashboard` 管理功能搬移至 `/admin` 路由下集中管理。

## What Changes

- 新增 `/user/{id}` 路由，作為學員專屬資料頁面（所有已登入使用者皆可查閱）
- 頁面包含「基本資料單元」，顯示：
  - 姓名（realName）
  - 身分標籤（依 learningLevel 顯示對應啟動靈人等級，例：「啟動靈人 1 已完成」）
  - 已完成課程（列出學員已修畢的課程項目）
- 登入後預設路由改為 `/user/{currentUserId}`
- 原 `/dashboard` 內容（統計卡片、近期會員、開課功能）搬移至 `/admin` 路由

## Capabilities

### New Capabilities
- `student-profile-page`: 學員專屬頁面 `/user/{id}`，含基本資料單元（姓名、身分標籤、已完成課程），所有已登入使用者皆可存取

### Modified Capabilities
- `dashboard-home`: `/dashboard` 路由改為重定向至 `/admin`；登入後預設落點改為 `/user/{id}`

## Impact

- 新增路由：`app/(user)/user/[id]/page.tsx`
- 新增路由：`app/(user)/admin/page.tsx`（原 dashboard 內容搬移）
- 修改登入後導向邏輯（`lib/auth.ts` signIn callback 或 `/dashboard` redirect）
- 修改 `app/(user)/dashboard/page.tsx`：改為 redirect 至 `/admin`
- 讀取現有 `User.realName`、`User.learningLevel`、`InviteEnrollment` 資料
- 側邊欄導覽連結需同步更新
