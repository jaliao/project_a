## 1. 累計演算法優化

- [x] 1.1 `lib/data/church-course-growth.ts` 的 `getChurchCourseGrowth()`：
  - 將 `userEarliest` 依 `key`（churchKey）分組，每組取出 `at` 陣列並排序（由早到晚）。
  - 對每個 `key`，用單調遊標（只增不減）依序推進 `bounds[0..availableMonths]`：`cumByKey.get(key)![b]` = 該組排序陣列中 `at < bounds[b]` 的元素數（遊標累加，不重新從頭掃描）。
  - `overallCum` 改為：取全部 `userEarliest.values()` 的 `at`，合併排序成單一陣列，用同一套單調遊標推進算出每個邊界的總數，取代目前「逐 key 加總」的寫法。
  - 移除原本「每個邊界對每個 key 重新線性掃描全部 `userEarliest.values()`」的三層迴圈。

## 2. 避免重複查詢可選年度清單

- [x] 2.1 `lib/data/church-course-growth.ts` 的 `getChurchCourseGrowth()`：新增可選參數 `availableYears?: { value: string; label: string }[]`；提供時直接使用，不呼叫 `getAvailableGrowthYears()`；未提供時維持原行為（內部查詢）。
- [x] 2.2 `app/[locale]/(admin)/admin/analytics/church-course-growth/page.tsx`：呼叫 `getChurchCourseGrowth(catalogId, year, years)` 時傳入已查到的 `years`。

## 3. 版本號

- [x] 3.1 `config/version.json` patch +1，`updatedAt` 更新為當日日期。

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 4.2 情境：以本機 dev DB 既有資料，比對改動前後 `getChurchCourseGrowth()` 對同一 `catalogId`/`year` 的回傳結果（`rows`、`chartChurchIds`、`overallYearTotal`、`overallCumTotal`）完全一致。（寫腳本比對新舊演算法：冊別 1/2/3 × 2025/2026 年度共 6 組，`overallCumTotal`／`overallYearTotal`／逐教會累計全數一致，PASS）
- [x] 4.3 情境：頁面請求時確認 `getAvailableGrowthYears()`（`InviteEnrollment` 的 `MIN(joinedAt)` 聚合）僅執行一次。（監測 `prisma.inviteEnrollment.aggregate` 呼叫次數：傳入 `availableYears` 時呼叫 0 次，PASS）
- [x] 4.4 情境：未傳入 `availableYears` 時直接呼叫 `getChurchCourseGrowth()`（維持舊呼叫方式）仍正常運作，不報錯。（同一監測腳本：未傳入時 `aggregate` 呼叫 1 次、`hasData: true`，行為與改動前一致，PASS）
