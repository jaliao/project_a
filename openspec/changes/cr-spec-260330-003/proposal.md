## Why

目前課程先修關聯（seed + migration）採用單層設計（2→1, 3→2, 4→3），導致：
1. 報名啟動靈人 3 的學員只需完成 2，不需要完成 1——邏輯有誤
2. 課程目錄缺少簡介欄位，管理員無法填寫課程說明，前台也無顯示入口

## What Changes

### 1. 先修關聯修正（累積式先修）
- 啟動靈人 2：先修 1
- 啟動靈人 3：先修 1、2
- 啟動靈人 4：先修 1、2、3
- 更新 `prisma/seed.ts` 的 `prerequisiteMap` 為累積式設定
- 新增 migration SQL 修正既有 `_CoursePrerequisites` 資料（先清空再重新插入）

### 2. 課程簡介欄位（description）
- `CourseCatalog` 新增 `description String?`（可空，選填）
- Migration：`ALTER TABLE course_catalogs ADD COLUMN description TEXT`
- `lib/data/course-catalog.ts`：所有查詢加入 `description` 欄位
- `CourseCatalogEntry` 型別加入 `description: string | null`
- `app/actions/course-catalog.ts`：`updateCourse` 接受 `description` 參數並寫入 DB
- `components/course-catalog/edit-course-dialog.tsx`：新增 `description` Textarea 欄位
- `components/course-catalog/course-catalog-table.tsx`：顯示簡介（截斷顯示）

## Capabilities

- course-catalog-prerequisites-fix：修正先修關聯為累積式
- course-catalog-description：新增課程簡介欄位（DB + Admin UI）

## Impact

- 資料模型：`CourseCatalog` 新增欄位（backward compatible，nullable）
- 先修資料：seed 與 migration 修正既有關聯（幂等）
- API：`updateCourse` 介面新增 `description` 欄位
- UI：Admin 課程目錄頁面新增簡介 Textarea
- 無 breaking change（description 為 nullable，現有程式可直接忽略）
