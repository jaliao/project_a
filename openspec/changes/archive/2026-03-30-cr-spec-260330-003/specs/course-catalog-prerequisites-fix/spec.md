## 先修關聯修正（累積式）

### 目標行為

| 課程 | 先修課程 |
|------|----------|
| 啟動靈人 1 | 無 |
| 啟動靈人 2 | 啟動靈人 1 |
| 啟動靈人 3 | 啟動靈人 1、啟動靈人 2 |
| 啟動靈人 4 | 啟動靈人 1、啟動靈人 2、啟動靈人 3 |

### 驗證規則
- `checkPrerequisites(userId, 3)` 需同時檢查 userId 是否結業了 id=1 且 id=2
- `checkPrerequisites(userId, 4)` 需同時檢查 id=1、id=2、id=3
- 現有 `checkPrerequisites` 實作不需修改（已正確查詢所有先修，只需修正資料本身）

### 異動範圍
1. **`prisma/seed.ts`**：prerequisiteMap 改為累積式（2→[1], 3→[1,2], 4→[1,2,3]），並在 set 前先 disconnect 所有現有先修（`set: []` 再 connect），確保幂等
2. **新增 migration**：`prisma/migrations/20260330000002_fix_course_prerequisites/migration.sql`
   - 先確認 join table 欄位方向
   - 清空 `_CoursePrerequisites`
   - 插入正確的累積式先修關聯
