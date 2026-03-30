## 技術設計

### 1. 先修關聯修正

**問題根因**：`_CoursePrerequisites` 是隱式多對多 join table，Prisma 以 `connect` 方式新增關聯，但 seed 每次只連單層，導致累積關係未建立。

**修正策略**：
- seed.ts 改為累積式 prerequisiteMap，每個課程連結所有低編號課程
- 新增 migration 先刪除 `_CoursePrerequisites` 全部資料再重新 INSERT（幂等）

**累積式設計**：
```
啟動靈人 2 → prerequisiteIds: [1]
啟動靈人 3 → prerequisiteIds: [1, 2]
啟動靈人 4 → prerequisiteIds: [1, 2, 3]
```

### 2. description 欄位

**Schema**：
```prisma
model CourseCatalog {
  // ... 現有欄位
  description String?  // 課程簡介（可空）
}
```

**Migration**：
```sql
ALTER TABLE course_catalogs ADD COLUMN description TEXT;
-- 先修關聯修正
DELETE FROM "_CoursePrerequisites";
INSERT INTO "_CoursePrerequisites" ("A", "B") VALUES
  (1, 2), (1, 3), (2, 3), (1, 4), (2, 4), (3, 4);
```
> `_CoursePrerequisites` 欄位慣例：A = prerequisiteOf（被先修），B = prerequisites（需先修）。
> 需確認 Prisma 隱式 join table 的 A/B 欄位方向再寫入。

**Data Layer**（`lib/data/course-catalog.ts`）：
- `CourseCatalogEntry` 型別：新增 `description: string | null`
- 所有 `select` 加入 `description: true`

**Server Action**（`app/actions/course-catalog.ts`）：
- `updateCourse(id, { label, isActive, prerequisiteIds, description })` 加入 `description` 欄位

**Admin UI**：
- `edit-course-dialog.tsx`：`description` Textarea（rows=3，選填，placeholder「輸入課程簡介」）
- `course-catalog-table.tsx`：顯示簡介欄（最多 2 行截斷，text-muted-foreground）

### 確認 Prisma join table 方向

Prisma 隱式 many-to-many join table `_CoursePrerequisites` 的欄位方向需查詢 migration SQL 或直接 SELECT 確認後再寫入。若方向相反，所有先修關係會反轉（課程 A 變成需先修課程 B）。Migration 執行前需先驗證現有資料方向。
