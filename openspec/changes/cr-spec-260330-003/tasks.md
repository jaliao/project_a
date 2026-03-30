## 1. 先修關聯修正

- [ ] 1.1 確認 `_CoursePrerequisites` join table 的 A/B 欄位方向（查詢現有資料或 migration SQL）
- [ ] 1.2 新增 `prisma/migrations/20260330000002_fix_course_prerequisites/migration.sql`：清空 join table 並插入累積式先修資料
- [ ] 1.3 更新 `prisma/seed.ts`：prerequisiteMap 改為累積式，每次 upsert 前先 `set: []` 清空再 connect

## 2. 課程簡介欄位（description）

- [ ] 2.1 更新 `prisma/schema/course-catalog.prisma`：新增 `description String?`
- [ ] 2.2 在 1.2 的 migration SQL 中加入 `ALTER TABLE course_catalogs ADD COLUMN description TEXT`（或合併為新 migration）
- [ ] 2.3 更新 `lib/data/course-catalog.ts`：`CourseCatalogEntry` 型別加 `description: string | null`，所有 `select` 加 `description: true`
- [ ] 2.4 更新 `app/actions/course-catalog.ts`：`updateCourse` 接受 `description?: string | null`，寫入 DB
- [ ] 2.5 更新 `components/course-catalog/edit-course-dialog.tsx`：新增 description Textarea（rows=3，選填）
- [ ] 2.6 更新 `components/course-catalog/course-catalog-table.tsx`：顯示簡介（line-clamp-2，無簡介顯示 —）

## 3. 驗證

- [ ] 3.1 執行 `make schema-update name=add_course_description_fix_prereqs`，確認 migration 成功
- [ ] 3.2 執行 `npm run build`，確認無 TypeScript 編譯錯誤
- [ ] 3.3 更新 `config/version.json` patch 版本號 +1
- [ ] 3.4 更新 `README-AI.md`
