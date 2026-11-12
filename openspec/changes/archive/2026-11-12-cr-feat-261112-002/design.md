## Context

現有「世代倍增」子區塊的教師世代分布（`generations()`）與逐教師明細下載（`generationTeacherDetails()`）皆建立在「**教師集合**」之上：候選教師（曾建立啟動靈人課程邀請）中，收斂為「本人在 cutoff 前也已結業」者（`CR-FIX-261024-002`）。這個集合刻意**排除**了「只結業、自己從未開課」的一般學員——他們從未出現在這兩個函式的輸出中。

使用者要的巢狀階層匯出（比照範例 Excel）需要同時顯示這些「只結業未開課」的學員（作為樹狀圖的葉節點），因此不能直接沿用 `generationTeacherDetails()` 的輸出，必須在資料層另外建立一份「教師 → 直屬下線」的完整對應關係，範圍比既有教師集合更廣。

兩者共用的底層事實相同：`InviteEnrollment`（`courseCatalogId = 1`、`graduatedAt` 非空且早於 cutoff）每一筆代表「某學員在某教師建立的班級結業」。既有函式從這份資料推導「學員→其最早一筆結業對應的教師（mentorOf）」；本次新函式需要的是它的反向關係「教師→其帶出的直屬學員清單」，兩者本質上是同一份 `mentorOf` 的正逆索引，不需要另外查詢資料庫。

## Goals / Non-Goals

**Goals:**
- 新增 `generationHierarchyRows(end)`，建立涵蓋**所有**已結業學員（不限教師集合）的巢狀樹狀結構，依深度優先展開為扁平列表供 Excel 輸出。
- 下載輸出改為「依深度分欄」的巢狀縮排樣式：每深一層的標籤往右移一欄，有直屬下線的節點標示人數。
- 直接取代現有平鋪格式，不保留平鋪版本、不新增第二個下載按鈕。

**Non-Goals:**
- 不處理使用者截圖中的顏色區塊（代表何種分類）與「◯組」分組標籤——已與使用者確認排除。
- 不更動「世代倍增」子區塊的長條圖統計或「說明」對話框（兩者維持既有、較嚴格的「教師集合」口徑，不受本次新增的巢狀視角影響）。
- 不保證巢狀樹的節點數／「代別」與長條圖統計能逐項互相核對——新樹涵蓋範圍比教師集合更廣（詳見 Risks），舊 spec 中「匯出內容 SHALL 與畫面上彙總長條圖可互相核對」的要求將隨本次改版移除，改以「每個節點的直屬下線人數加總＝其下一層節點數」這種結構自洽性檢查取代。

## Decisions

### 1. 新函式 `generationHierarchyRows()`：反轉既有 `mentorOf`，不另建查詢

沿用與 `generationTeacherDetails()` 完全相同的 `enrollRows` 查詢與 `mentorOf: Map<studentId, {teacherId, at}>` 建立方式（每位學員的最早一筆結業紀錄決定其「教師」），但**不**將節點範圍收斂為教師集合。改為以 `mentorOf` 反轉建立 `childrenOf: Map<teacherId, studentId[]>`（每個 teacherId 對應其直屬下線的 `studentId` 清單，依各學員自己的 `earliestGraduatedAt` 升冪排序，與現有明細排序慣例一致）。

```ts
export type HierarchyRow = {
  label: string          // 一律 labelWithName(spiritId, realName, nickname, teacherNo, fallbackId)：任一欄位缺值僅省略該欄位，全部缺值退回 fallbackId
  depth: number           // 0-based，相對其所屬根節點
  directChildCount: number // 0 代表葉節點（無下線）
}

export async function generationHierarchyRows(end: Date): Promise<HierarchyRow[]>
```

### 2. 根節點判定：沿用「無 mentor」定義，不要求本人已結業

一個人被列為某棵樹的根節點，條件是：`childrenOf.get(id)` 非空（有至少一位直屬下線）且 `mentorOf.get(id)` 不存在（本人從未以學員身分結業過，或其對應教師為自己）。**不**要求本人已結業（這點與 `generations()`／`generationTeacherDetails()` 的「教師集合」資格不同——那邊額外要求「本人也已結業」，本次刻意放寬，否則範例中像「只開課未必自己也結業」的根節點會憑空消失，整棵樹跟著不見）。

多個根節點依各自 `earliestGraduatedAt`（即其直屬下線中最早的結業時間，取 `childrenOf` 清單的第一筆，因已排序）升冪排列，輸出時一棵樹接著一棵樹。

### 3. 節點顯示格式：所有節點一律套用同一套完整格式

每個節點（不分是否有下線、是否具教師身分）皆以 `labelWithName(spiritId, realName, nickname, teacherNo, fallbackId)` 顯示，格式「{啟動編號} {姓名}({暱稱}) {講師編號}」（`User.teacherNo`，如 `A001`）。任一欄位缺值僅省略該欄位；姓名與暱稱皆缺則省略整個姓名段；全部欄位皆缺退回帳號識別碼。此格式同時套用於既有（目前無人呼叫）的 `generationTeacherDetails()` 之 `teacherLabel`／`mentorLabel`，與本函式共用同一個 `labelWithName()`。

**判斷依據變更歷程**（同一輪使用者回饋過程，依序收斂）：
1. 初版僅以「是否有下線」（`directChildCount > 0`）決定要不要套用完整格式，葉節點一律僅顯示姓名（比照使用者原始截圖）。
2. 使用者發現「方光瑋」（具 `teacher_1` 身分，但在這棵世代鏈中剛好沒有自己的直屬下線）被當成一般學員葉節點只顯示姓名，不符預期；改為「有下線 **或** 本人具教師身分」雙條件判斷。
3. 使用者接著發現「周恬伃」（不具教師身分、無下線的一般學員）仍只顯示姓名，追問原因；確認那是雙條件判斷下的正確行為後，使用者決定**不再區分條件，所有節點一律套用完整格式**——即本節最終版本，移除了「是否有下線」與「是否具教師身分」兩項判斷，`label()` 不再需要 `hasChildren` 參數。
- 影響範圍：絕大多數已結業學員皆有 `spiritId`（結業時核發），改成一律套用完整格式後，原本「葉節點僅顯示姓名」的畫面會變成「葉節點也顯示啟動編號（+暱稱，若有）」，不再比照使用者原始截圖的純姓名樣式——這是使用者在本輪追問後明確要求的最終決定，取代原先「比照截圖」的設計前提。

### 4. 遞迴防護：複用 `MAX_GEN` 常數

深度優先展開時，沿用既有 `MAX_GEN = 10` 作為深度上限與環路防護（遞迴路徑上重複出現同一人 id，或深度達到 `MAX_GEN`，即停止往下展開、該節點強制視為葉節點處理，即使其 `childrenOf` 實際非空也不再往下列出）。與 `generations()`／`generationTeacherDetails()` 的既有環路防護手法一致，只是套用對象從「教師世代計算」換成「樹狀展開」。

### 5. Excel 輸出：AOA 依深度分欄，新增 `xlsxAoaDownloadResponse()`

既有 `xlsxDownloadResponse()`（`lib/utils/xlsx-export.ts`）用 `XLSX.utils.json_to_sheet`，只適合「一列一筆扁平物件」的格式，無法表達「依深度把值放進不同欄位」的巢狀排版。新增同檔案的 `xlsxAoaDownloadResponse(aoa: unknown[][], sheetName, filename)`，用 `XLSX.utils.aoa_to_sheet` 直接吃二維陣列，`generations/export/route.ts` 改用這個新函式；其餘既有呼叫端（`members/export`、`members/unrecovered/export`）不受影響，維持用原本的 `xlsxDownloadResponse()`。

Route handler 組 AOA 的邏輯：
1. 算出本次資料實際最大深度 `maxDepth`（取所有列 `depth` 的最大值，無資料時為 0），欄位數＝`maxDepth + 1`（第 0～N 代）+ 1（直屬下線人數）。
2. 表頭：`['第0代', '第1代', ..., '第N代', '直屬下線人數']`。
3. 每列：長度為欄位數的陣列，索引 `row.depth` 填 `row.label`，其餘「第 N 代」欄位留空字串，最後一欄 `directChildCount > 0 ? directChildCount : ''`。

## Risks / Trade-offs

- **與長條圖統計脫鉤**：新樹涵蓋「所有已結業學員」，範圍比「世代倍增」子區塊長條圖的教師集合更廣（還多了從未開課的學員葉節點），且根節點判定條件也更寬鬆（不要求本人已結業）。這代表巢狀匯出的節點數／層數**不會**剛好等於長條圖各代教師人數，兩者是刻意從同一份原始資料推導出的兩種不同切角，不是口徑不一致的 bug。已於 proposal.md 的 Impact 與下方 spec delta 中明確記載，避免日後被誤認為資料錯誤。
- **欄位數隨資料成長**：樹的實際最大深度若未來隨資料增長變大，匯出的欄位數會跟著變多（最多到 `MAX_GEN + 1 = 11` 代欄位）；比固定欄位的平鋪表少一分穩定性，但本次使用者要的就是這種依深度展開的樣式，非既有平鋪表所能表達。
- **效能**：`generationHierarchyRows()` 的查詢規模與既有兩個函式相同（同一份 `enrollRows`），深度優先展開為記憶體內運算，資料量級與既有函式一致，預期無額外效能疑慮。
- **不再比照使用者原始截圖的「葉節點僅姓名」樣式**：經過本輪三次來回確認（見決策 3 變更歷程），使用者最終決定所有節點一律顯示啟動編號／暱稱／講師編號，不再保留截圖中「一般學員葉節點僅顯示姓名」的簡潔樣式。此為使用者明確要求的最終決定，取代最初 Non-Goals／proposal 中「比照截圖」的設計前提。
