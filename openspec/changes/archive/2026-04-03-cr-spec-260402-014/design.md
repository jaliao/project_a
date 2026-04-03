## Context

Topbar（`components/layout/topbar.tsx`）目前只有 `unreadCount` prop，`role`/`spiritId` 均未傳入，無法做條件渲染；`app/(user)/layout.tsx` 從 session 取得這兩個值但未下傳。通知 Drawer 使用 shadcn `SheetContent`，其內建關閉按鈕定位於 `absolute right-4 top-4`，而標頭使用 `flex-row justify-between`，「全部標為已讀」被推到最右側與 X 重疊。個人資料頁位於 `/profile`（`app/(user)/profile/`），與「學員頁面 `/user/[spiritId]`」的路由哲學不一致，且 Topbar 個人資料按鈕目前導向固定 `/profile` 而非動態路徑。

## Goals / Non-Goals

**Goals:**
- Topbar 新增「回首頁」（→ `/user/{spiritId}`）與「後台管理」（→ `/admin`，admin/superadmin only）導覽按鈕
- 修正通知 Drawer 標頭按鈕重疊，使「全部標為已讀」可正常點擊
- 個人資料頁路由從 `/profile` 遷移至 `/user/[spiritId]/profile`，全站連結一併更新

**Non-Goals:**
- 不更動個人資料頁的功能或表單欄位
- 不更動通知 Drawer 的通知列表邏輯
- 不更動 `/admin` 頁面本身

## Decisions

### Topbar props 擴充
`Topbar` 新增 `role: UserRole` 與 `spiritId: string` props，由 `app/(user)/layout.tsx`（Server Component）從 session 取得後傳入。選擇在 layout 層傳入而非在 Topbar 內部呼叫 `auth()`，因 Topbar 是 Client Component，維持 Server/Client 邊界。

### 通知 Drawer 標頭修法
將「全部標為已讀」移出 `flex-row justify-between`，改為在 `SheetTitle` 下方或在 SheetHeader 右側加 `pr-10`（為 X 按鈕留空間）。選擇加 `pr-10` 最簡單，不影響其他樣式。

### profile 路由遷移
目前 `app/(user)/profile/` 整個目錄移至 `app/(user)/user/[spiritId]/profile/`。
- `profile-form.tsx` 的 Google OAuth `callbackUrl` 從 `'/profile'` 改為動態取得（可從 `useParams` 讀取 spiritId）
- `app/change-password/page.tsx` 改導向 `/user/{spiritId}/profile`（從 session 取得）
- `app/page.tsx` 與 `/dashboard` 的 fallback 路徑移除（所有已登入使用者皆有 spiritId，不需 fallback）

## Risks / Trade-offs

- **舊連結失效**：`/profile` 舊書籤會 404。緩解：`app/(user)/profile/page.tsx` 保留為 redirect → `/user/{spiritId}/profile`（server redirect，讀 session）
- **spiritId 尚未核發**：極少數情況（新使用者首次 Google 登入 race condition）spiritId 為 null。已有 `app/page.tsx` 的 fallback 邏輯保護，遷移後改導向 `/profile`（仍保留 redirect 頁）

## Migration Plan

1. 新增 `app/(user)/user/[spiritId]/profile/` 路由（page.tsx + profile-form.tsx）
2. 原 `app/(user)/profile/page.tsx` 改為 server redirect → `/user/{spiritId}/profile`
3. 更新所有 `/profile` 硬編連結
4. 無 DB migration
