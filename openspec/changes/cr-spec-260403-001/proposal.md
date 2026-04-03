## Why

`/admin/settings` 目前只有單一頁面，未來設定項目會持續增加（階層深度、教會代碼等）。
使用 Tabs 分頁將不同類型設定整合在同一路由下，避免側邊欄/功能卡片入口持續增生。

## What Changes

- `app/(user)/admin/settings/page.tsx`：改為 Tabs 版面，預設進入「基本設定」分頁
- 新增分頁「教會代碼維護」：將 `/admin/churches` 的內容搬移至此分頁
- `app/(user)/admin/churches/page.tsx`：改為 redirect → `/admin/settings?tab=churches`
- `app/(user)/admin/page.tsx`：後台首頁功能卡片「教會管理」入口改連結至 `/admin/settings?tab=churches`
- `app/actions/church.ts`：`revalidatePath` 路徑更新為 `/admin/settings`

## Capabilities

### New Capabilities
- `admin-settings-tabs`：系統設定頁改為 Tabs 佈局（基本設定 / 教會代碼維護），進入頁面預設顯示「基本設定」分頁，可透過 URL `?tab=churches` 直接導航至教會分頁

### Modified Capabilities
（無 spec-level 行為變更，僅路由整合）

## Impact

- `app/(user)/admin/settings/page.tsx` — 重構為含 Tabs 的 Server Component
- `app/(user)/admin/churches/page.tsx` — 改為 redirect 頁
- `app/(user)/admin/page.tsx` — 更新教會管理卡片連結
- `app/actions/church.ts` — revalidatePath 改為 `/admin/settings`
- `components/admin/church-list.tsx` — 不需改動（純 UI 元件）
- `components/admin/hierarchy-depth-form.tsx` — 不需改動
