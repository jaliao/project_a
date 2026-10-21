## Context

`getChurchCourseGrowth()`（`lib/data/church-course-growth.ts`）目前對每個邊界（最多 13 個：去年底基準 + 1~12 月底）、每個教會，都重新線性掃描一次全部 `userEarliest` 報名明細來數「幾人在這個邊界之前加入」，複雜度為 `O(邊界數 × 教會數 × 報名數)`。此外，`page.tsx` 的 `Promise.all` 與 `getChurchCourseGrowth()` 內部各自呼叫一次 `getAvailableGrowthYears()`（全表 `MIN(joinedAt)` 聚合），同一請求查了兩次。

## Goals / Non-Goals

**Goals:**
- 降低累計計算的時間複雜度，使其隨資料量成長時仍可接受（接近線性，而非乘積成長）。
- 同一請求只查詢一次可選年度清單。
- 對外回傳的資料內容與既有頁面行為完全不變。

**Non-Goals:**
- 不改變 `ChurchCourseGrowthReport`／`ChurchGrowthRow`／`GrowthMonthPoint` 的欄位定義。
- 不處理 CR-REFACTOR-261021-001、CR-FIX-261021-003 的範圍（分屬世代倍增匯出、外寄信覆寫）。

## Decisions

- **各教會的 `joinedAt` 先依教會分組、組內排序，再用單調遊標依序推進各邊界的累計數，取代目前「每邊界對每教會重新掃描全部報名」的寫法。**
  理由：13 個邊界是遞增的時間切點，每個教會自己的 `joinedAt` 清單排序後，用一個指標從頭到尾單向推進（指標只增不減）即可算出該教會在所有 13 個邊界下的累計數，每個教會整體只需一次排序（`O(n log n)`）加一次線性掃描（`O(n)`），總複雜度從 `O(邊界數 × 教會數 × 報名數)` 降為 `O(報名數 log 報名數 + 邊界數 × 教會數)`。

- **`overallCum`（全教會合計）改用「全部報名的 `joinedAt` 排序後，同一套單調遊標」直接算，不透過逐教會加總。**
  理由：全教會合計本質上就是「不分教會、所有人的加入時間排序後的累計」，直接對完整排序陣列做一次遊標推進最省事，不需要先算出每個教會的結果再相加（省去一層迴圈）。

- **`getChurchCourseGrowth()` 新增可選參數 `availableYears`，未提供時維持原行為（自行查詢），提供時直接使用。**
  理由：維持函式可獨立呼叫（例如未來若有其他呼叫端沒有現成的年度清單），同時讓 `page.tsx` 這個已經查過一次的呼叫端可以省掉重複查詢，向後相容。

## Risks / Trade-offs

（無顯著風險，純演算法與查詢次數最佳化，輸出結果與既有邏輯在數學上等價——皆為「依時間排序後的累計計數」，只是計算方式不同）

## Migration Plan

純內部實作調整，無資料庫變更、無對外行為變更：
1. 修改 `getChurchCourseGrowth()` 的累計演算法與新增可選參數。
2. `page.tsx` 傳入已查到的 `years`。
3. 回退：還原 `church-course-growth.ts` 與 `page.tsx` 至改動前版本即可。
