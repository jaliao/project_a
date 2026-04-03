## Why

課程目錄管理屬於系統設定範疇，與教會代碼維護同類。
整合至 `/admin/settings` Tabs 可統一管理入口，後台首頁只保留日常操作功能。

## What Changes

- `app/(user)/admin/settings/settings-tabs.tsx`：新增「課程目錄管理」分頁（Tab），整合原 `/admin/course-catalog` 頁面內容
- `app/(user)/admin/settings/page.tsx`：fetch CourseCatalog 資料並傳給 SettingsTabs
- `app/(user)/admin/course-catalog/page.tsx`：改為 server redirect → `/admin/settings?tab=courses`
- `app/(user)/admin/page.tsx`：移除「課程管理」功能卡片
- `app/actions/course-catalog.ts`（如有 revalidatePath）：更新路徑為 `/admin/settings`

## Capabilities

### New Capabilities
- `admin-settings-course-catalog`：系統設定新增「課程目錄管理」分頁，整合原課程目錄 CRUD

### Modified Capabilities
（無 spec-level 行為變更，僅路由整合）

## Impact

- `app/(user)/admin/settings/settings-tabs.tsx` — 新增第三個 Tab
- `app/(user)/admin/settings/page.tsx` — 新增 CourseCatalog 資料 fetch
- `app/(user)/admin/course-catalog/page.tsx` — 改為 redirect
- `app/(user)/admin/page.tsx` — 移除課程管理卡片
- `app/actions/course-catalog.ts` — revalidatePath 更新（若有）
- `components/admin/` 中 course-catalog 相關元件 — 不需改動
