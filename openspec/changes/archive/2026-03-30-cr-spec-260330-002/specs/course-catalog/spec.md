## MODIFIED Requirements

### Requirement: 課程目錄定義
系統 SHALL 以資料庫（`CourseCatalog` table）管理課程目錄，每門課程含 `id`（int，主鍵）、`label`（顯示名稱，可編輯）、`isActive`（是否開放）、`sortOrder`（顯示排序）、`prerequisites`（先修課程多對多自關聯）。系統 SHALL 移除 `CourseLevel` enum 及 `config/course-catalog.ts`。

#### Scenario: 課程目錄從資料庫讀取
- **WHEN** 系統讀取課程目錄
- **THEN** 返回 `CourseCatalog` table 中所有記錄，依 `sortOrder` 排序

#### Scenario: 課程名稱從資料庫讀取
- **WHEN** 系統顯示任何課程名稱（開課選單、課程卡片、邀請表單等）
- **THEN** 名稱來源為 `CourseCatalog.label`，非硬編碼靜態字串

#### Scenario: 初始 seed 資料包含四門課程
- **WHEN** 執行資料庫 seed
- **THEN** 四筆課程資料存在：啟動靈人 1（isActive: true）、啟動靈人 2（isActive: true）、啟動靈人 3（isActive: false）、啟動靈人 4（isActive: false），並包含對應先修關聯

### Requirement: CourseInvite 綁定課程目錄
每個 CourseInvite 記錄 SHALL 包含 `courseCatalogId`（FK → `CourseCatalog.id`），標示該邀請屬於哪門課程。`CourseLevel` enum 欄位 SHALL 一併移除。

#### Scenario: 建立邀請時指定課程
- **WHEN** 教師建立邀請並選擇某課程
- **THEN** CourseInvite 記錄的 `courseCatalogId` 儲存對應的 `CourseCatalog.id`

### Requirement: 建立邀請課程選擇只顯示開放課程
建立邀請表單 SHALL 只列出 `CourseCatalog.isActive` 為 true 的課程供教師選擇。

#### Scenario: 表單不顯示未開放課程
- **WHEN** 教師開啟建立邀請 Dialog
- **THEN** 課程選單只顯示 isActive 為 true 的課程，名稱來自 `CourseCatalog.label`，依 `sortOrder` 排序

## REMOVED Requirements

### Requirement: CourseLevel enum 定義
**Reason**: 課程數量不固定，enum 每次新增課程都需 DB migration；改為純 DB table 更彈性。
**Migration**: 移除 `CourseLevel` enum 及所有引用（`CourseInvite.courseLevel`、`config/course-catalog.ts`），改用 `CourseCatalog.id` 作關聯。
