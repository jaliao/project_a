## Context

課程目錄目前硬編碼於 `config/course-catalog.ts`，四門課程的名稱、isActive、先修條件均為靜態值。所有讀取課程資料的元件（~10 個檔案）直接 import 這個 config。先修驗證邏輯（`course-prerequisite` spec）以 `learningLevel >= prerequisiteLevel`（單一數字比較）實作，分散在 `app/actions/course-session.ts`、`app/actions/course-invite.ts`。

## Goals / Non-Goals

**Goals:**
- 將課程目錄資料搬至資料庫，支援管理員動態編輯
- Admin UI 提供課程名稱、isActive、先修課程（多選）CRUD
- 先修驗證改為多選邏輯：「必須完成所有指定先修課程的結業」
- 移除靜態 config 中的 label / isActive，`CourseLevel` enum 保留

**Non-Goals:**
- 不新增/刪除課程等級（維持 level1–4，新增/刪除 level 需 DB migration）
- 不改動課程報名、開課、結業等其他業務流程
- 不支援課程排序自訂（維持 level 數字順序）

## Decisions

### 1. Schema：`CourseCatalog` 以 int autoincrement 為主鍵，移除 `CourseLevel` enum

```
CourseCatalog {
  id        Int      @id @default(autoincrement())
  label     String
  isActive  Boolean  @default(false)
  sortOrder Int      @default(0)   // 控制顯示順序
  // 多對多自關聯（先修）
  prerequisites    CourseCatalog[]  @relation("CoursePrerequisites")
  prerequisiteOf   CourseCatalog[]  @relation("CoursePrerequisites")
}
```

`CourseInvite.courseLevel`（原 `CourseLevel` enum）改為：
```
CourseInvite {
  courseCatalogId Int
  courseCatalog   CourseCatalog @relation(...)
  // courseLevel 欄位與 CourseLevel enum 一併移除
}
```

**理由：** 課程數量未來可能超過 4 個；無正式環境既有資料，無向後相容包袱。以 int 主鍵完全解耦 enum，新增課程只需 DB insert，不需 migration 修改 enum。`CourseLevel` enum 連同所有引用一併刪除。

**替代方案：** 保留 enum 並擴充值 — 每新增一門課都需 Prisma migration 修改 enum，維運成本高，不採用。

### 2. 先修驗證：改為「已結業集合包含所有先修課程 id」

新邏輯：讀取 `CourseCatalog[targetId].prerequisites`，對每個先修課程，確認使用者有 `InviteEnrollment.graduatedAt IS NOT NULL`（透過 `CourseInvite.courseCatalogId` join）的記錄。

```typescript
// 偽碼
const prereqs = await getPrerequisites(targetCatalogId)
const graduatedCatalogIds = await getGraduatedCatalogIds(userId)
const missing = prereqs.filter(p => !graduatedCatalogIds.has(p.id))
```

**理由：** 多對多先修以 catalog id 比對，與 enum 完全解耦。結業以 `InviteEnrollment.graduatedAt` 為準，與現行邏輯一致。

**`getUserLearningLevel()`：** 此函式依賴 `CourseLevel` enum 的數字排序，隨 enum 移除一併刪除。learner profile 顯示「已結業課程清單」改為查 `CourseCatalog.label`。

### 3. Data Layer：新增 `lib/data/course-catalog.ts`（async）

取代 `config/course-catalog.ts` 的 sync 函式，改為 async DB 查詢。呼叫端（多為 Server Component 或 Server Action）已是 async，改動成本低。Client Component 若需課程清單，由 Server Component 作為 props 傳入。

### 4. Admin UI：`app/(user)/admin/course-catalog/page.tsx`

- 存取控制：Server Action 與 page 均以 `session.user.role === 'admin' || 'superadmin'` 把關
- 使用現有 shadcn/ui 元件（Dialog、Switch、Checkbox）
- 先修多選以 Checkbox group 呈現（課程數固定為 4，不需複雜的 Combobox）

### 5. Migration Seed

新增 migration 後，同步更新 `prisma/seed.ts`，依 `config/course-catalog.ts` 現有值插入 `CourseCatalog` 初始資料（含先修關聯），確保既有環境 `make prisma-seed` 後即可使用。

## Risks / Trade-offs

- **CourseLevel enum 引用廣泛** → 刪除 enum 後 TypeScript 編譯錯誤會列出所有殘留引用，逐一替換為 `courseCatalogId: Int` 再刪除 config
- **先修邏輯散落多處** → 統一封裝成 `checkPrerequisites(userId, targetCatalogId)` helper，action 層呼叫它，不重複實作
- **`getUserLearningLevel()` 被移除** → 搜尋所有呼叫端並替換為「已結業課程清單」查詢
- **DB 查詢效能** → 課程目錄筆數少，可不加 cache；若未來課程增多再考慮 `unstable_cache`

## Migration Plan

1. 移除 `CourseLevel` enum；新增 `CourseCatalog` model；`CourseInvite.courseLevel` 改為 `courseCatalogId Int`
2. 執行 `make schema-update name=course_catalog_db_driven`
3. 更新 `prisma/seed.ts`，插入初始課程資料（啟動靈人 1–4，含先修關聯）
4. 新增 `lib/data/course-catalog.ts`（async 查詢函式，取代 config）
5. 新增 `app/actions/course-catalog.ts`（admin CRUD）
6. 新增 `app/(user)/admin/course-catalog/` 頁面與元件
7. 逐步替換所有 `CourseLevel`、`COURSE_CATALOG`、`getCourse()`、`getActiveCourses()`、`getUserLearningLevel()` 引用
8. 刪除 `config/course-catalog.ts`
9. 執行 `make prisma-seed`，驗證 TypeScript build 通過

**Rollback：** 無正式環境資料，dev 環境可 `make clean && make dev && make schema-update && make prisma-seed` 完整重建。
