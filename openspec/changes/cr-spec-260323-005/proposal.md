## Why

登入後缺乏統一的首頁入口，使用者無法快速執行常用操作（新增課程、管理個人資料、查看訊息）。參考 shadcn/ui Dashboard 範例，建立結構清晰、功能完整的登入後首頁，提升使用者操作效率。

## What Changes

- 新增登入後首頁（`/dashboard`），取代現有空白的 `(user)` 根路由
- 新增根路由 `app/page.tsx`：未登入由 middleware 攔截導向 `/login`，已登入導向 `/dashboard`
- 新增頂部工具列（Topbar），包含三個快速操作按鈕：
  - **新增課程**：開啟新增課程流程（快速入口）
  - **維護個人資料**：導向 `/profile` 頁面
  - **訊息**：顯示系統訊息通知（含未讀數量 Badge）
- 首頁主體採用 shadcn/ui Dashboard 佈局（卡片式統計摘要 + 近期活動列表）

## Capabilities

### New Capabilities
- `dashboard-home`: 登入後首頁，含統計卡片與近期活動，路由為 `/dashboard`
- `topbar`: 頂部工具列元件，含新增課程、個人資料、訊息三個操作按鈕，整合至 `(user)` layout

### Modified Capabilities
- （無現有 spec 需異動）

## Impact

- `app/(user)/layout.tsx` — 加入 Topbar 元件
- `app/(user)/dashboard/page.tsx` — 新增首頁頁面
- `components/layout/topbar.tsx` — 新增 Topbar 元件
- `components/dashboard/` — 統計卡片、近期活動等子元件
- 路由：新增 `/dashboard`，登入後預設導向此頁
- 依賴：shadcn/ui（已安裝）、Tabler Icons（已安裝）
