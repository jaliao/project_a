## Context

`generations/export/route.ts` 的 `formatDateTime()` 目前直接用 `Date.prototype.toISOString()` 取時間字串，該方法回傳值固定為 UTC，與專案其餘以 `Asia/Taipei` 為基準的時間顯示（`taipeiYearMonth` 等）不一致。

## Goals / Non-Goals

**Goals:**
- 匯出檔案中的時間欄位與專案其餘 Asia/Taipei 時間顯示慣例一致，核對月份邊界時不失真。

**Non-Goals:**
- 不變更 `generationTeacherDetails()` 的查詢或推導邏輯，不影響彙總數字。

## Decisions

- **改用 `Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', ... })` 組出「YYYY-MM-DD HH:mm:ss」字串**，而非手動用 `toISOString()` 加減時差字串運算。
  理由：`Intl.DateTimeFormat` 是專案既有 `taipeiYearMonth()` 已採用的手法，行為正確（含夏令時等邊界情況，雖然台灣無夏令時但手法本身更穩健），不需要自己處理時區位移運算。

## Risks / Trade-offs

（無顯著風險，純顯示格式修正，不影響資料正確性或既有呼叫方）

## Migration Plan

純函式內部實作修正，無資料庫變更、無既有資料相容性問題：
1. 修改 `formatDateTime()` 實作。
2. 回退：還原該函式即可。
