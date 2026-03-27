## Why

Dashboard 首頁目前呈現統計卡片與分散的功能入口，缺乏結構化的功能導覽。本次將首頁重組為「學習」、「授課」、「管理者」三個明確單元，讓不同角色的使用者能快速找到對應功能入口。本次僅實作 UI 佈局，不實作功能邏輯。

## What Changes

- 重組 `/dashboard` 首頁為三個功能單元區塊：
  - **學習單元**：加入學習（按鈕佔位）、學習紀錄（連結至現有 `/learning`）
  - **授課單元**：新增開課（整合現有 CourseSessionDialog）、開課查詢（按鈕佔位）
  - **管理者單元**：連結至 `/admin`，僅 `admin` 或 `superadmin` 角色可見
- 移除舊有的「快速連結」列與獨立的「開課管理」區塊，整合進新結構
- 管理者單元依 session.user.role 判斷顯示（Server Component 判斷，無需 Client）
- 功能按鈕目前為 UI 佔位（disabled 或無 onClick），不實作實際功能

## Capabilities

### New Capabilities
- `dashboard-function-units`: Dashboard 三個功能單元 UI 佈局（學習、授課、管理者），含角色判斷顯示管理者區塊

### Modified Capabilities
- `dashboard-home`: 首頁結構改為三欄式功能單元，取代現有分散式入口

## Impact

- `app/(user)/dashboard/page.tsx` — 重組頁面結構，加入角色判斷，引入新 UI 元件
- `components/dashboard/function-units.tsx` — 新增三個功能單元 UI 元件（或直接內嵌於 page）
- 現有 CourseSessionDialog 保留，整合至授課單元
- 現有 `/learning` 路由連結保留
- 不需 DB schema 變更、不需新 Server Action
