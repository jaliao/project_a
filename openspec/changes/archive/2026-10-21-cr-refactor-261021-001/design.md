## Context

CR-FEAT-261021-002 新增「世代倍增」raw data 下載時，比照既有兩份會員匯出端點（`members/export`、`members/unrecovered/export`）的寫法各自複製了一份「auth 檢查 + xlsx 產出」樣板，`/code-review` 指出三處可改善之處：月份驗證多查了一次全表聚合、教師姓名查詢可與主查詢合併、三份匯出端點樣板重複。

## Goals / Non-Goals

**Goals:**
- 降低 `generations/export` 下載時的資料庫查詢次數。
- 消除三份匯出端點的重複樣板程式碼，集中成單一共用 helper。
- 不改變三份匯出功能現有的下載內容與欄位。

**Non-Goals:**
- 不變更任何匯出檔案的欄位內容、xlsx 格式、檔名規則。
- 不處理 `lib/mailer.ts`、`church-course-growth.ts` 的效能問題——分別屬於 CR-FIX-261021-003、CR-REFACTOR-261021-002。

## Decisions

- **`generations/export` 的月份驗證改為純格式檢查（regex），不合法直接回 400，不再呼叫 `getAvailableReportMonths()`。**
  理由：這支端點的下載連結永遠來自頁面自身已經驗證、顯示在畫面上的 `report.month`（見 `monthly-report-section.tsx` 的 `<a href>`），不會有「合法格式但不在歷史資料範圍內」的正常使用情境；若有人手動帶入格式不合法的值，直接 400 比靜默回退到其他月份更明確（避免下載到「以為是這個月，其實是別的月」的資料）。`taipeiMonthBounds()` 本身對任何格式正確的 `YYYY-MM` 字串都能正確算出邊界，不需要「是否存在歷史資料」這層額外查詢來保護它。

- **`generationTeacherDetails()` 在原查詢的 `select` 加 `invite: { select: { createdById, createdBy: { select: { spiritId, realName } } } }`，於同一次迴圈建立 `labelById`。**
  理由：每一列 enrollment 的 `invite.createdById` 就是某位教師的 id；而每位會出現在 `mentorId` 位置的人，依定義必然也在 `teacherSet` 中、也必然在某一列的 `invite.createdById` 出現過——因此姓名對照表可以在處理 enrollment 列的同一個迴圈中一次建好，不需要事後再對 `teacherIds` 發一次 `user.findMany`。

- **抽出 `lib/utils/xlsx-export.ts` 共用 helper，三份匯出端點改用它，但資料查詢與欄位組裝邏輯仍留在各自檔案。**
  理由：三份端點的「身分驗證」與「xlsx 產出＋下載標頭」部分逐字重複，是明確的樣板重複；但各端點查什麼資料、欄位叫什麼名字彼此無關，不適合連同抽成共用邏輯——helper 只處理「輸入 rows + sheet 名稱 + 檔名 → 輸出 xlsx Response」與「驗證 admin 身分」這兩個與業務邏輯無關的機械步驟。

## Risks / Trade-offs

- [`generations/export` 從「不合法月份回退」改為「直接 400」是行為變更] → 風險低：此端點目前唯一呼叫來源是頁面自身產生的連結，不會傳入不合法值；此變更已記錄為本次 Impact 的一部分，供日後追蹤。
- [三份匯出端點改用共用 helper，若 helper 本身有 bug 會同時影響三處] → `requireAdminSession()`／`xlsxDownloadResponse()` 皆為既有驗證過的邏輯（直接搬移既有程式碼，非重寫），風險低；且三份端點在這次改動後都要跑過既有/新增的 build 與下載驗證。

## Migration Plan

純內部實作調整，無資料庫變更、無對外行為新增：
1. 新增 `lib/utils/xlsx-export.ts`。
2. 三份匯出端點改用該 helper，移除各自重複的驗證與 xlsx 產出程式碼。
3. `generations/export` 月份驗證改為格式檢查；`generationTeacherDetails()` 合併查詢。
4. 回退：還原三個 route 檔案與 `generationTeacherDetails()` 至改動前版本，刪除新增的 helper 檔案即可。
