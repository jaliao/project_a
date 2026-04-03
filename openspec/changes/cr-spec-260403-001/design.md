## Context

目前後台設定分散於兩個路由：
- `/admin/settings`：系統設定（superadmin，學習階層深度）
- `/admin/churches`：教會管理（admin/superadmin）

隨著設定類型增加，這樣的分散方式不易維護。此 CR 將兩者整合至 `/admin/settings`，以 Tabs 分頁管理。

**現有元件（不需改動）：**
- `components/admin/hierarchy-depth-form.tsx`
- `components/admin/church-list.tsx`

## Goals / Non-Goals

**Goals:**
- `/admin/settings` 改為 Tabs 版面（基本設定 / 教會代碼維護）
- 進入頁面預設顯示「基本設定」分頁
- `?tab=churches` URL 參數直接導航至教會代碼維護分頁
- `/admin/churches` 改為 redirect（保留相容）
- 後台首頁功能卡片入口連結更新

**Non-Goals:**
- 教會管理 CRUD 邏輯不變
- 基本設定內容不變（不新增設定項）
- 不改動角色權限規則

## Decisions

**Tab 實作方式：shadcn/ui `<Tabs>` + URL 參數**
- `?tab=` 控制 active tab，預設 `basic`，教會分頁為 `churches`
- Server Component 讀取 `searchParams.tab` 決定初始 tab 值
- Tab 切換透過 `<Link href="?tab=...">` 實現（不使用 client state，保留瀏覽器歷史）
- 使用 `<Tabs value={activeTab}>` + `<TabsList>` 組合

**權限整合：**
- 整個 `/admin/settings` 頁面：admin/superadmin 可進入（放寬，原本 superadmin only）
- 「基本設定」分頁內容（學習階層深度）：superadmin only（原本行為，在 tab 內再做條件判斷）
- 「教會代碼維護」分頁：admin/superadmin 皆可（原本 `/admin/churches` 行為）

**`/admin/churches` 保留 redirect：**
- 改為 server redirect → `/admin/settings?tab=churches`
- 避免 `app/actions/church.ts` revalidatePath 錯誤，同步更新為 `/admin/settings`

## Risks / Trade-offs

- [Tab 切換為 full page navigation] → 接受，設定頁操作頻率低，不需 SPA 體驗
- [superadmin 才能看基本設定，但 admin 可進入 /admin/settings] → 設計上合理，基本設定 tab 仍顯示，但 HierarchyDepthForm 區塊加條件渲染（`role === superadmin`）
