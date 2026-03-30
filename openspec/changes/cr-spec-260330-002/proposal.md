## Why

課程目錄目前以 `config/course-catalog.ts` 硬編碼管理，每次調整課程名稱、開放狀態或先修條件都需要修改程式碼並重新部署。需要提供 Admin UI 讓管理員直接在後台維護課程設定，無需改動程式碼。

## What Changes

- **新增** `CourseCatalog` 資料庫資料表，儲存課程名稱、isActive、先修課程（多選）
- **新增** Admin 後台頁面：課程目錄管理（CRUD）
- **修改** 課程先修條件：由單一 `prerequisiteLevel: number | null` 改為多選（**BREAKING**）
- **修改** 所有顯示課程名稱的地方改為從資料庫讀取，不再使用 config 靜態值
- **移除** `config/course-catalog.ts` 的課程名稱與 isActive 硬編碼邏輯（保留 CourseLevel enum 供既有資料相容）

## Capabilities

### New Capabilities
- `course-catalog-admin`: Admin UI 頁面，提供課程目錄的新增、編輯、刪除功能；包含課程名稱輸入、isActive 切換、先修課程多選設定

### Modified Capabilities
- `course-catalog`: 課程目錄資料來源從 config 改為資料庫（`CourseCatalog` table），label / isActive / prerequisiteLevel 動態讀取；CourseLevel enum 保留供關聯欄位使用
- `course-prerequisite`: 先修條件從單一 level 比較改為「必須完成所有指定先修課程」的多選驗證邏輯

## Impact

- **Schema**：新增 `CourseCatalog` model（level, label, isActive, prerequisites 多對多關聯）
- **Data Layer**：`lib/data/course-catalog.ts` 改為從 DB 查詢
- **Server Actions**：新增 `app/actions/course-catalog.ts`（admin CRUD）
- **App Router**：新增 `app/(user)/admin/course-catalog/` 路由（admin/superadmin 限定）
- **所有使用 `COURSE_CATALOG`、`getCourse()`、`getActiveCourses()` 的元件**：改用 DB 查詢結果
