## Why

`/code-review` 針對 CR-FEAT-261021-001 新增的「教會冊別成長分析」頁面，指出兩個效能問題：
1. `lib/data/church-course-growth.ts` 的 `getChurchCourseGrowth()` 計算各月累計時，對每個邊界（最多 13 個）× 每個教會都重新掃一次完整報名清單（`O(邊界數 × 教會數 × 報名數)`），而非先排序後用遊標累加，隨資料量成長會呈倍數變慢。
2. `app/[locale]/(admin)/admin/analytics/church-course-growth/page.tsx` 與 `getChurchCourseGrowth()` 內部各自呼叫一次 `getAvailableGrowthYears()`（全表 `MIN(joinedAt)` 聚合），同一請求查了兩次。

## What Changes

- `getChurchCourseGrowth()` 的累計計算改為：先依 `churchKey` 分組並排序各自的 `joinedAt`，再用單調遊標依序推進各邊界的累計數（取代目前「每個邊界對每個教會重新線性掃描全部報名」的寫法），整體累計 `overallCum` 同樣改用排序後遊標推進，不逐教會加總。
- `getChurchCourseGrowth()` 新增可選參數 `availableYears`：有傳入時直接使用，不再內部重複呼叫 `getAvailableGrowthYears()`；`page.tsx` 將自己已查到的 `years` 傳入，避免同一請求查詢可選年度兩次。

## Capabilities

### Added Capabilities

（無）

## Impact

- **修改** `lib/data/church-course-growth.ts`：`getChurchCourseGrowth()` 內部累計演算法改用排序＋遊標，新增 `availableYears` 可選參數。
- **修改** `app/[locale]/(admin)/admin/analytics/church-course-growth/page.tsx`：呼叫 `getChurchCourseGrowth()` 時傳入已查到的 `years`。
- **不變更**對外回傳的 `ChurchCourseGrowthReport` 型別與欄位內容、頁面呈現與既有篩選行為。
- **不需要**資料庫 schema 變更、不影響操作手冊（純內部效能調整，使用者看到的畫面與數字不變）。
- **版本號**：`config/version.json` patch +1。
