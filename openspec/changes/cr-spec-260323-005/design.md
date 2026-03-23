## Context

目前 `(user)` 路由群組缺乏根 layout 與首頁，登入後無明確落點。middleware 已處理未登入攔截與臨時密碼強制導向，但成功登入後尚未定義預設重定向目標。

本次以 [shadcn/ui Dashboard 範例](https://ui.shadcn.com/examples/dashboard) 為視覺參考，建立首頁入口與共用頂部工具列。

## Goals / Non-Goals

**Goals:**
- 建立 `(user)/layout.tsx`，包含 Topbar，所有登入後頁面共用
- 新增 `/dashboard` 首頁：統計卡片 + 近期活動列表
- Topbar 三個操作入口：新增課程（預留）、個人資料、訊息
- 登入後預設導向 `/dashboard`

**Non-Goals:**
- 完整課程管理功能（本次僅預留 Topbar 按鈕入口）
- 訊息系統後端（本次顯示靜態 UI，Badge 固定為 0）
- 側邊欄（Sidebar）導航（本次不引入）
- 響應式 Mobile drawer 選單

## Decisions

### 1. Layout 結構：Topbar-only，無 Sidebar
**選擇**：`(user)/layout.tsx` 只加 Topbar，不加 Sidebar。
**理由**：目前功能數量少，Sidebar 會增加複雜度且浪費空間。待功能擴充後再評估是否加入。

### 2. 首頁路由：`/dashboard`（非 `/(user)`）
**選擇**：首頁路由為 `/dashboard`，`app/(user)/dashboard/page.tsx`。
**理由**：URL 明確、易於分享與書籤；`(user)` 為 route group，不影響 URL 路徑。
登入後重定向由 `lib/auth.ts` 的 `signIn` callback 設定 `callbackUrl` 預設為 `/dashboard`。

### 3. 統計卡片資料來源：Server Component + Prisma 直接查詢
**選擇**：`/dashboard` 為 Server Component，直接呼叫 Prisma 取得統計數字。
**理由**：資料量小，無需額外 API route；符合現有 Server Action pattern。
**替代方案考慮**：`lib/data/` 封裝 — 目前僅此頁使用，過早抽象，待有第二個使用方再搬移。

### 4. 訊息 Badge：靜態 UI，不接後端
**選擇**：Topbar 訊息 icon 顯示，Badge 先寫死為 0 或不顯示。
**理由**：訊息系統尚未定義需求，避免提前設計。

### 5. 新增課程按鈕：預留 onClick，不實作 Dialog
**選擇**：按鈕顯示但 onClick 為 `console.log` 佔位。
**理由**：課程模組尚未設計，不應在此 PR 混入。

## Risks / Trade-offs

- **無 Sidebar 導航** → 頁面間跳轉依賴 Topbar 或麵包屑；若功能增加需補充導覽元件
- **統計卡片直接查 DB** → 若資料量大需加快取；目前 MVP 階段可接受
- **Topbar 共用 layout** → 若部分登入後頁面不需要 Topbar 需另建 layout group

## Migration Plan

1. 新增 `app/(user)/layout.tsx`（含 Topbar）
2. 新增 `components/layout/topbar.tsx`
3. 新增 `app/(user)/dashboard/page.tsx` + 子元件
4. 修改 `lib/auth.ts`：設定登入後預設 redirect 至 `/dashboard`
5. 無 DB schema 變更，無需 migration

## Open Questions

- 統計卡片顯示哪些指標？（建議：會員總數、本月新增會員、課程總數 — 待確認）
- 訊息系統是否在後續 CR 中定義？
