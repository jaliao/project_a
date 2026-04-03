## 1. SettingsTabs 新增課程目錄管理分頁

- [x] 1.1 `app/(user)/admin/settings/settings-tabs.tsx`：import `CourseCatalogTable`，新增 `courses` prop（`CourseCatalogEntry[]`），新增「課程目錄管理」TabsTrigger（`value="courses"`）與 TabsContent
- [x] 1.2 `app/(user)/admin/settings/page.tsx`：`searchParams` 加入 `courses` 有效 tab 值；`Promise.all` 新增 `getAllCourses()`；將 courses 傳給 `SettingsTabs`

## 2. /admin/course-catalog 相容處理

- [x] 2.1 `app/(user)/admin/course-catalog/page.tsx`：改為 server redirect → `/admin/settings?tab=courses`
- [x] 2.2 `app/actions/course-catalog.ts`：`revalidatePath('/admin/course-catalog')` 更新為 `revalidatePath('/admin/settings')`

## 3. 後台首頁移除課程管理卡片

- [x] 3.1 `app/(user)/admin/page.tsx`：移除「課程管理」功能卡片（title: '課程管理'）及未使用的 `IconBook` import

## 4. 版本與文件

- [x] 4.1 `config/version.json` patch 版本號 +1
- [x] 4.2 依 `.ai-rules.md` 更新 `README-AI.md`
