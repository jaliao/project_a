## Why

`/admin/dashboard`「世代倍增」子區塊的「下載 raw data」（`app/api/admin/dashboard/generations/export/route.ts`）目前輸出平鋪表，每列一位**教師**（`generationTeacherDetails()` 回傳，僅限「本人也已結業」的教師集合），欄位為教師啟動編號姓名／代別／導師啟動編號姓名／導師代別／最早帶出一人結業時間。

使用者提供了一份人工彙整的 Excel 範例（`啟動靈人名單-9.xlsx`），以巢狀縮排的樹狀結構呈現同一份師生傳承鏈：每位教師為根節點，往下遞迴列出其直屬下線（可能是另一位教師、也可能是單純結業但自己從未開課的學員），每個「有下線」的節點旁標示其直屬下線人數。這種呈現方式比平鋪表更直觀地看出整條世代鏈的分支關係，使用者要求直接取代現有下載格式。

與使用者確認過的範圍（已排除範例中的顏色區塊與「◯組」分組標籤，不在本次處理）：
1. 樹狀圖要完整比照範例，納入「只結業、自己從未開課」的學員作為葉節點（純姓名，無啟動編號），不是只列現有「教師集合」。
2. 節點旁數字＝該節點的**直屬**下線人數（不含孫輩）。

## What Changes

- `lib/data/monthly-report.ts` 新增資料函式 `generationHierarchyRows(end)`：從「啟動靈人」已結業紀錄（`InviteEnrollment` where `courseCatalogId = 1`）建立「教師 → 直屬下線（學員）」的完整對應關係（**不**限於既有教師集合，任何有直屬下線的人皆可作為樹的節點），再以深度優先展開為一份扁平列表，每列含：顯示標籤（有下線者＝啟動編號+姓名、無下線者＝純姓名）、該節點在所屬根節點下的深度、直屬下線人數。
- `app/api/admin/dashboard/generations/export/route.ts` 改用 `generationHierarchyRows()` 取代 `generationTeacherDetails()`，並將輸出排版改為巢狀縮排樹狀結構：依深度把每列的標籤放進對應的「第 N 代」欄位（每深一層往右一欄），另以固定的「直屬下線人數」欄位標示有下線節點的人數，無下線則留空。**直接取代**現有平鋪格式，不保留舊版、不新增第二個下載選項。
- `lib/utils/xlsx-export.ts` 新增 `xlsxAoaDownloadResponse()`（基於 `XLSX.utils.aoa_to_sheet`），供巢狀縮排表這種「依深度決定欄位」的輸出使用；不更動既有 `xlsxDownloadResponse()`（`json_to_sheet`），避免影響其他既有匯出端點（會員清單、未找回帳號清單）。

## Capabilities

### Modified Capabilities
- `admin-dashboard-monthly-report`：「世代倍增原始資料下載」Requirement 由平鋪逐教師明細改為巢狀階層匯出；「世代倍增子區塊」（畫面上的長條圖統計）與「世代倍增數據定義說明」兩個 Requirement 不變。

## Impact

- **後端**：`lib/data/monthly-report.ts` 新增 `generationHierarchyRows()`（不修改既有 `generations()` / `generationTeacherDetails()`，兩者仍供畫面長條圖與未來其他用途使用）；`app/api/admin/dashboard/generations/export/route.ts` 改寫輸出邏輯；`lib/utils/xlsx-export.ts` 新增一個輔助函式。
- **前端**：無變更——「下載 raw data」按鈕仍是同一個連結（`monthly-report-section.tsx`），只有下載內容的格式改變。
- 不涉及畫面上「世代倍增」子區塊的長條圖統計、「說明」對話框文字（皆維持現有教師集合口徑不變，本次新增的巢狀樹狀圖是獨立於該口徑之外的另一種檢視角度，刻意涵蓋更廣的名單——詳見 design.md 的 Risks/Trade-offs）。
- 不處理使用者截圖中的顏色區塊與「◯組」分組標籤（已與使用者確認排除於本次範圍）。
