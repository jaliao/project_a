## Context

「世代倍增」子區塊的代別計算與逐教師明細匯出在 CR-FEAT-261021-002 隨 CR-FIX-261021-002（時區修正）、CR-REFACTOR-261021-001（效能/重複程式碼微調）陸續定案並已合併至 `main`。管理者實測後指出兩點與預期不符：代別應從 0 起算而非 1；匯出的教師/導師欄位應同時顯示啟動編號與姓名，而非目前「有編號就不顯示姓名」的二選一邏輯。

`generations()`（畫面彙總長條圖用）與 `generationTeacherDetails()`（下載明細用）各自獨立實作同一套 `gen()` 遞迴，需兩處同步修改才能保持彙總數字與明細可互相核對（既有 Requirement「世代倍增原始資料下載」已明文要求兩者一致）。

## Goals / Non-Goals

**Goals:**
- 根節點教師（無導師／導師為自己／導師不在教師集合）計為第 0 代，其餘＝導師代別 + 1，畫面彙總與下載明細皆同步改用新起點。
- 下載明細的教師／導師欄位同時顯示啟動編號與姓名，任一缺失時仍能顯示另一者。

**Non-Goals:**
- 不改變「教師」「導師（mentor）」本身的認定邏輯（帶人結業者才算教師、最早結業課程建立者為導師），僅調整代別數字的起點與呈現格式。
- 不改變環路防護與 `MAX_GEN` 世代深度上限的保護機制本身，僅調整其回傳/截斷的代別數值基準。
- 不改變匯出端點（`generations/export/route.ts`）本身的驗證、檔名、xlsx 產出邏輯。

## Decisions

- **base case 與環路防護回傳值由 `1` 改為 `0`，遞迴遞增量維持 `+1` 不變。**
  理由：最小改動即可讓代別整體位移一格，且 `generations()` 與 `generationTeacherDetails()` 兩處遞迴結構相同，可用相同手法同步修改，維持彙總與明細一致。

- **新增 `labelWithName(spiritId, realName, fallbackId)` helper，格式固定為「{啟動編號} {姓名}」，兩者皆缺退回 `fallbackId`。**
  理由：維持原有「有什麼就顯示什麼」的容錯精神（避免因單一欄位缺值而完全無法辨識該帳號），但編號與姓名都存在時兩者並列顯示，滿足「核對用明細需同時看到編號與姓名」的實際需求。畫面彙總長條圖不顯示個人標籤，故 helper 僅用於 `generationTeacherDetails()`。

- **`monthly-report-section.tsx` 的「說明」Dialog 與長條圖文案直接同步改字，不額外抽取共用「代別起點」常數。**
  理由：代別起點是語意固定的業務規則（非可配置項），既有程式碼也未抽常數管理，維持現狀寫法、僅調整字面值與遞迴 base case，不過度設計。

## Risks / Trade-offs

- 代別數字位移屬於**對外可見的統計口徑變更**：若有管理者已依「第 1 代」口徑記錄過去月份報表，切換月份重新計算後代別數字會整體 -1。此為使用者明確提出的需求變更，非程式錯誤，無需相容舊口徑。
- `generationTeacherDetails()` 目前 label 組裝邏輯（`spiritId ?? realName ?? teacherId`）亦用於 `mentorLabel`，改動需同時覆蓋兩處呼叫點，否則會出現教師顯示新格式、導師仍顯示舊格式的不一致。

## Migration Plan

純既有資料推導邏輯與文案調整，無資料庫變更、無需 migration：
1. 修改 `generations()`、`generationTeacherDetails()` 的 `gen()` base case 與環路防護回傳值。
2. 新增 label helper 並套用於 `generationTeacherDetails()` 的 `teacherLabel`／`mentorLabel`。
3. 同步修改 `monthly-report-section.tsx` 文案。
4. 回退：還原上述檔案即可，無資料相容性問題。
