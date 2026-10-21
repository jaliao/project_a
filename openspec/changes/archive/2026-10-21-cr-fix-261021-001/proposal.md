## Why

`/admin/dashboard` 月報「世代倍增發展追蹤」子區塊（`lib/data/monthly-report.ts` 的 `generations()`／`generationTeacherDetails()`，前端 `monthly-report-section.tsx`，匯出端點 `app/api/admin/dashboard/generations/export/route.ts`）實測後發現兩個與使用者預期不符的問題：

1. **代別起算點**：目前「根節點教師」（無導師、導師為自己、或導師不在教師集合中）計為「第 1 代」，其餘代別依序 +1。管理者預期代別應從「第 0 代」開始計算，即根節點教師＝第 0 代。
2. **Excel 匯出缺姓名**：下載的 `generations-YYYY-MM.xlsx`「教師啟動編號姓名」「導師啟動編號姓名」欄位實際只顯示啟動編號（`spiritId`，如 `PA260001`），看不到姓名——`generationTeacherDetails()` 組 label 時用 `spiritId ?? realName`，有編號時完全不帶姓名，與欄位名稱「編號姓名」本該同時呈現兩者的預期不符。

## What Changes

- 代別計算起點改為 0：`generations()`、`generationTeacherDetails()` 兩處 `gen()` 遞迴的 base case（無導師／導師為自己／導師不在教師集合）與環路防護回傳值，由 `1` 改為 `0`；世代深度上限 `MAX_GEN` 的截斷邏輯不變（僅上限保護，非代別定義的一部分）。
- 教師／導師標籤同時顯示啟動編號與姓名：新增組字串 helper，格式為「{啟動編號} {姓名}」（以空白分隔）；啟動編號或姓名缺其一時僅顯示現有的那個，兩者都沒有才退回帳號 id。`generationTeacherDetails()` 的 `teacherLabel`／`mentorLabel` 改用此 helper。
- 同步更新畫面文案與「說明」對話框（`monthly-report-section.tsx`）中「第 1 代」相關描述，改為「第 0 代」。
- 同步更新 `openspec/specs/admin-dashboard-monthly-report/spec.md` 對應三個 Requirement（世代倍增子區塊／世代倍增原始資料下載／世代倍增數據定義說明）的文字與情境範例，反映第 0 代起算與編號+姓名同時顯示。

## Capabilities

### Modified Capabilities

- `admin-dashboard-monthly-report`：「世代倍增」子區塊與其原始資料下載、數據定義說明三個既有 Requirement，代別定義改為第 0 代起算；下載內容的教師／導師欄位同時顯示啟動編號與姓名。

## Impact

- **修改** `lib/data/monthly-report.ts`：`generations()`、`generationTeacherDetails()` 的 `gen()` base case 與環路防護回傳值改為 `0`；新增 label 組字串 helper 並套用於 `generationTeacherDetails()`。
- **修改** `app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx`：世代長條圖與「說明」Dialog 文案中「第 1 代」改為「第 0 代」。
- **不修改** `app/api/admin/dashboard/generations/export/route.ts` 本身邏輯（僅透過上游 `generationTeacherDetails()` 回傳值自然帶出新格式）。
- **不需要**資料庫 schema 變更（純既有資料推導邏輯調整）。
- **操作手冊**：`doc/管理者操作手冊.md`「世代倍增發展追蹤」段落若有提及「第 1 代」需同步改為「第 0 代」。
- **版本號**：`config/version.json` patch +1。
