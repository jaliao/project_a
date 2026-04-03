## Context

沿用 cr-spec-260403-001 建立的 `/admin/settings` Tabs 架構，已有「基本設定」與「教會代碼維護」兩個分頁。
本 CR 新增第三個分頁「課程目錄管理」，整合 `/admin/course-catalog` 的內容（`CourseCatalogTable` 元件）。

**現有可重用元件：**
- `components/course-catalog/course-catalog-table.tsx`（Client Component）
- `lib/data/course-catalog.ts` — `getAllCourses()`

## Goals / Non-Goals

**Goals:**
- `SettingsTabs` 新增「課程目錄管理」第三個 Tab（`?tab=courses`）
- `app/(user)/admin/settings/page.tsx`：fetch CourseCatalog 並傳給 `SettingsTabs`
- `/admin/course-catalog` 改為 redirect → `/admin/settings?tab=courses`
- `app/actions/course-catalog.ts`：`revalidatePath('/admin/course-catalog')` 改為 `/admin/settings`
- 後台首頁移除「課程管理」功能卡片

**Non-Goals:**
- CourseCatalogTable 邏輯不改動
- 課程目錄 CRUD 行為不變

## Decisions

**Tab 值：`courses`（一致性，與 `churches` 對齊）**

**SettingsTabs props 擴充：**
- 新增 `courses: CourseCatalogEntry[]` prop
- CourseCatalogTable 已是 Client Component，可直接在 SettingsTabs 中渲染

**CourseCatalogEntry 型別：**
- 來自 `lib/data/course-catalog.ts`，直接 import 複用

**revalidatePath 更新：**
- `app/actions/course-catalog.ts` 中 `/admin/course-catalog` → `/admin/settings`
- `/admin` 的 revalidatePath 保留（後台首頁仍需更新）

## Risks / Trade-offs

- [Settings 頁面三個 Tab 各需不同資料，同步 fetch 可能增加頁面載入時間] → 接受，三個查詢均輕量，以 Promise.all 並行
