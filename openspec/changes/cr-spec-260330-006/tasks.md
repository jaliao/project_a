## 1. Migration

- [x] 1.1 新增 `prisma/migrations/20260330000003_clear_course1_prerequisites/migration.sql`：`DELETE FROM "_CoursePrerequisites" WHERE "A" = 1;`
- [x] 1.2 執行 `make schema-update name=clear_course1_prerequisites`，確認 migration 成功

## 2. Seed 修正

- [x] 2.1 更新 `prisma/seed.ts`：在 prerequisiteMap 迴圈前新增 `await prisma.courseCatalog.update({ where: { id: 1 }, data: { prerequisites: { set: [] } } })`

## 3. 驗證

- [x] 3.1 執行 `npm run build`，確認無 TypeScript 編譯錯誤
- [x] 3.2 更新 `config/version.json` patch 版本號 +1
- [x] 3.3 更新 `README-AI.md`
