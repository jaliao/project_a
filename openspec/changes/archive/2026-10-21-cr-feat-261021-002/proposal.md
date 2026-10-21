## Why

後台儀表板（`/admin/dashboard`）「世代倍增發展追蹤」子區塊（`lib/data/monthly-report.ts` 的 `generations()`、`monthly-report-section.tsx` 第二區塊）僅呈現各代教師人數的長條圖，管理者只看到彙總結果，無法得知：
1. 哪些教師帳號被計入第幾代。
2. 每位教師的「導師（mentor）」判定依據（最早帶其結業的教師是誰）。

當數字與管理者預期不符時，無法自行核對資料依據，只能回頭問開發。管理者需要能下載這份統計背後的逐教師明細，並需要一份白話說明解釋「代」的定義與判定邏輯。

## What Changes

- 「世代倍增發展追蹤」子區塊標題旁新增兩個按鈕：
  - **下載 raw data**：匯出 Excel（`.xlsx`，比照 `app/api/admin/members/export/route.ts` 的既有匯出慣例），內容為「本月底」界線下，教師集合中每位教師的逐列明細：教師啟動編號/姓名、代別、導師啟動編號/姓名（無則顯示「—」）、導師代別（無則「—」）、該教師最早帶出一人結業的時間（即被計入教師集合的依據時間）。下載範圍隨目前頁面所選月份（`?month=YYYY-MM`）連動。
  - **說明**：點擊開啟一個對話框（`Dialog`），以白話文字說明「代」的定義與判定邏輯（教師集合如何認定、導師如何判定、第 1 代的三種情形、環路與代數上限防護），純靜態文字，不含資料查詢。
- 新增一個 Server Action／Route Handler 匯出端點，重用現有 `generations()` 的查詢條件，額外回傳逐教師明細（現有 `generations()` 僅回傳彙總 `buckets`，不動其既有回傳格式，新增一支取得明細的函式）。

## Capabilities

### Added Capabilities

（無新增獨立能力，本次為既有 `admin-dashboard-monthly-report` 能力的子區塊新增下載與說明功能）

## Impact

- **修改** `lib/data/monthly-report.ts`：新增 `generationTeacherDetails(end): Promise<GenerationTeacherDetail[]>`（重用 `generations()` 內部邏輯，額外回傳逐教師明細），不變更既有 `generations()` 回傳格式與呼叫方。
- **新檔** `app/api/admin/dashboard/generations/export/route.ts`：比照 `app/api/admin/members/export/route.ts` 的驗證（`auth()` + `canAccessAdmin`）與 xlsx 產出寫法，依 `?month=YYYY-MM` 查詢參數匯出 Excel。
- **修改** `app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx`：世代倍增子區塊標題旁新增「下載 raw data」連結按鈕與「說明」按鈕（開啟 `Dialog`，沿用 `components/ui/dialog.tsx`）。
- **不需要**資料庫 schema 變更（純讀取既有資料，新增匯出端點與前端按鈕）。
- **操作手冊**：`doc/管理者操作手冊.md` 「世代倍增發展追蹤」相關段落補充下載與說明按鈕的用途。
- **版本號**：`config/version.json` patch +1。
