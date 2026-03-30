## 課程簡介欄位（description）

### 資料模型

```prisma
model CourseCatalog {
  id          Int     @id @default(autoincrement())
  label       String
  description String? // 課程簡介（選填）
  isActive    Boolean @default(false)
  sortOrder   Int     @default(0)
  // ...
}
```

### API 介面

`updateCourse(id, data)` 的 `data` 新增：
```typescript
description?: string | null
```

### UI 行為

**EditCourseDialog**：
- 在課程名稱下方新增「課程簡介」Textarea（rows=3）
- placeholder：「輸入課程簡介（選填）」
- 空字串送出時存為 `null`

**CourseCatalogTable**：
- 新增「簡介」欄（或在課程名稱下方顯示灰字簡介）
- 超過 2 行截斷（`line-clamp-2`）
- 無簡介時顯示 `—`

### 異動範圍
1. `prisma/schema/course-catalog.prisma`：新增 `description String?`
2. 新增 migration：`ALTER TABLE course_catalogs ADD COLUMN description TEXT`
3. `lib/data/course-catalog.ts`：`CourseCatalogEntry` 加 `description: string | null`，所有 select 加 `description: true`
4. `app/actions/course-catalog.ts`：`updateCourse` data 加 `description`
5. `components/course-catalog/edit-course-dialog.tsx`：新增 description Textarea
6. `components/course-catalog/course-catalog-table.tsx`：顯示簡介
