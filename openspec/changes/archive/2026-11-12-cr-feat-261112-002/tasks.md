## 1. 資料層：`lib/data/monthly-report.ts`

- [x] 1.1 新增型別 `HierarchyRow = { label: string; depth: number; directChildCount: number }`
- [x] 1.2 新增 `generationHierarchyRows(end: Date): Promise<HierarchyRow[]>`：
  - 沿用 `generationTeacherDetails()` 的 `enrollRows` 查詢（`graduatedAt` 非空且早於 `end`、`invite.courseCatalogId = BOOK1_CATALOG_ID`）與 `mentorOf`（每位學員最早一筆結業對應的教師）建立方式
  - 反轉 `mentorOf` 建立 `childrenOf: Map<teacherId, studentId[]>`，各教師的下線清單依學員自己的 `earliestGraduatedAt` 升冪排序
  - 根節點＝`childrenOf.get(id)` 非空且 `mentorOf.get(id)` 不存在（或其 mentor 為自己）；不要求本人已結業（與既有「教師集合」資格不同，見 design.md 決策 2）
  - 深度優先展開：沿用既有 `MAX_GEN` 常數作為深度上限，並以路徑上的 `seen` 集合防環路，達上限或偵測環路時該節點視為葉節點（不再往下展開）
  - 每個節點依是否有下線決定 `label` 格式：有下線＝`labelWithName(spiritId, realName, nickname, teacherNo, fallbackId)`（見第 6 節後續調整）；無下線＝僅姓名，缺姓名退回啟動編號，皆缺退回帳號識別碼
  - 多個根節點依各自下線中最早的 `earliestGraduatedAt` 升冪排列輸出

## 2. Excel 輸出：`lib/utils/xlsx-export.ts`

- [x] 2.1 新增 `xlsxAoaDownloadResponse(aoa: unknown[][], sheetName: string, filename: string): NextResponse`，以 `XLSX.utils.aoa_to_sheet` 建表（不修改既有 `xlsxDownloadResponse()`，避免影響 `members/export`、`members/unrecovered/export` 兩個既有呼叫端）

## 3. API Route：`app/api/admin/dashboard/generations/export/route.ts`

- [x] 3.1 改用 `generationHierarchyRows(end)` 取代 `generationTeacherDetails(end)`
- [x] 3.2 算出本次資料最大深度 `maxDepth`（無資料時為 0），組出表頭 `['第0代', '第1代', ..., '第N代', '直屬下線人數']`
- [x] 3.3 逐列組 AOA：長度為 `maxDepth + 2` 的陣列，索引 `row.depth` 填 `row.label`，其餘「第 N 代」欄位填空字串，最後一欄 `row.directChildCount > 0 ? row.directChildCount : ''`
- [x] 3.4 改呼叫 `xlsxAoaDownloadResponse()` 輸出（取代原本的 `xlsxDownloadResponse(rows, ...)`），檔名沿用現有 `generations-${month}.xlsx` 規則

## 4. 驗證

- [x] 4.1 以本機/測試環境真實資料呼叫 `generationHierarchyRows()`，人工核對至少一棵樹（根節點、其直屬下線數、至少一個再往下一層的教師節點與其葉節點）與資料庫原始紀錄一致——2026-11 cutoff：936 筆、maxDepth 5、3 個根節點；結構自洽性檢查（每節點 directChildCount 與其緊接子代列數）PASS
- [x] 4.2 確認「只結業未開課」的學員確實以葉節點身分出現在輸出中（不是只有教師集合裡的人）——763 筆葉節點，遠多於既有教師集合（295 筆），確認涵蓋範圍已擴大
- [x] 4.3 確認深度達上限或環路情境不會造成無窮遞迴或程式錯誤——程式邏輯以 `seen` 集合與 `depth < MAX_GEN` 雙重防護（程式碼檢視確認；本機資料實際 maxDepth 僅 5，未觸及 `MAX_GEN=10` 上限，無現成環路資料可實測）
- [x] 4.4 確認當月無資料時下載的 Excel 僅含表頭、無資料列，且不拋錯——以查無資料的月份（2000-01）呼叫 `generationHierarchyRows()`，回傳 0 筆、無例外
- [x] 4.5 確認 `members/export`、`members/unrecovered/export` 兩個既有匯出端點行為不受影響（`xlsxDownloadResponse()` 未被修改）——`git diff --stat` 確認僅變更 3 個檔案，皆不含這兩個端點
- [x] 4.6 `npm run lint`、`npm run build` 皆通過

## 5. 文件同步

- [x] 5.1 依 CLAUDE.md 第 9 點更新 `doc/管理者操作手冊.md`：「世代倍增發展追蹤」項目中「下載 raw data」說明改為巢狀階層樹狀結構，更新版本標頭與日期
- [x] 5.2 依 CLAUDE.md 第 7 點將 `config/version.json` patch 版本號 +1（目前 `0.1.238` → `0.1.239`），`updatedAt` 更新為當日日期；`README-AI.md` 索引版本號同步更新
- [x] 5.3 依 CLAUDE.md 第 8 點更新 `ai-context/05-business-logic.md`（世代倍增匯出改為巢狀階層）與 `ai-context/07-current-tasks.md`（「已完成」清單最前面附加本次 CR 紀錄）

## 6. 後續調整：統一有下線節點顯示格式（使用者檢視結果後提出）

- [x] 6.1 `labelWithName()` 簽章擴充為 `(spiritId, realName, nickname, teacherNo, fallbackId)`，格式「{啟動編號} {姓名}({暱稱}) {講師編號}」，任一欄位缺值僅省略該欄位，姓名與暱稱皆缺則省略整個姓名段，全部缺值退回 fallbackId
- [x] 6.2 `generationHierarchyRows()` 的使用者查詢補 `nickname`／`teacherNo` 欄位，有下線節點改呼叫新版 `labelWithName()`；葉節點格式不變（僅姓名）
- [x] 6.3 `generationTeacherDetails()`（目前無人呼叫，但與新函式共用 `labelWithName()`）同步補 `nickname`／`teacherNo` 查詢欄位，維持格式一致
- [x] 6.4 以本機真實資料驗證輸出字串（如 `PA260131 劉曉棋(劉曉棋) A032`；無講師編號時正確省略如 `PA260001 黃國倫(Gordon)`），`tsc --noEmit`／`npm run lint`／`npm run build` 皆通過
- [x] 6.5 同步更新 `design.md`／`specs/admin-dashboard-monthly-report/spec.md` 的顯示格式說明與 Scenario，`doc/管理者操作手冊.md`、`config/version.json`（0.1.239→0.1.240）、`README-AI.md`、`ai-context/05-business-logic.md`、`ai-context/07-current-tasks.md`

## 7. 後續調整：具教師身分但樹中暫無下線者也套用完整格式

- [x] 7.1 問題：使用者發現「方光瑋」（`roles` 含 `teacher_1`，但在這份世代鏈中沒有自己的直屬下線）仍只顯示姓名，未套用第 6 節的新格式——因原判斷邏輯僅以 `hasChildren` 決定，忽略了「本人具教師身分」這個情況
- [x] 7.2 `generationHierarchyRows()` 查詢補 `roles` 欄位；`label()` 改以 `hasChildren || isTeacher`（`roles.includes(TEACHER_ROLE_BY_CATALOG[BOOK1_CATALOG_ID])`，即 `teacher_1`）決定是否套用完整格式；無下線的教師節點不標示直屬下線人數（維持 0 人不顯示的既有規則）
- [x] 7.3 以本機真實資料驗證：「方光瑋」（`PA261775`，無講師編號）顯示為「PA261775 方光瑋(FANG MAX)」；其餘具教師身分但無下線的樣本（如 `PA261917 林恩琪(Deborah Lin)`）同步套用完整格式；一般學員葉節點（不具教師身分）仍維持僅顯示姓名；`tsc --noEmit`／`npm run lint`／`npm run build` 皆通過
- [x] 7.4 同步更新 `design.md`／`specs/admin-dashboard-monthly-report/spec.md`（新增教師身分葉節點 Scenario）、`doc/管理者操作手冊.md`（補充「或本人具啟動靈人講師身分」判斷條件的文案與版本標頭）、`config/version.json`（0.1.240→0.1.241）、`README-AI.md`、`ai-context/05-business-logic.md`、`ai-context/07-current-tasks.md`

## 8. 最終簡化：移除判斷條件，所有節點一律套用完整格式

- [x] 8.1 問題：使用者接著追問「周恬伃」（不具教師身分、無下線的一般學員）為何也沒有套用新格式，確認那是第 7 節雙條件判斷下的正確行為（她兩個條件都不符）後，使用者決定不再區分任何條件，所有節點一律套用完整格式，取代第 6、7 節的判斷邏輯
- [x] 8.2 `generationHierarchyRows()` 移除 `hasChildren`／`isTeacher` 判斷，`label(id)` 不再帶 `hasChildren` 參數，一律呼叫 `labelWithName(spiritId, realName, nickname, teacherNo, fallbackId)`；查詢不再需要 `roles` 欄位，移除對應 select 與 `TEACHER_ROLE_BY_CATALOG` import；「直屬下線人數」欄位邏輯不變（僅 `directChildCount > 0` 時填值）
- [x] 8.3 以本機真實資料驗證：「方光瑋」→「PA261775 方光瑋(FANG MAX)」、「周恬伃」→「PA260971 周恬伃(周恬伃)」、「黃國倫」（根節點）→「PA260001 黃國倫(Gordon)」直屬下線人數 70，皆正確套用統一格式；`tsc --noEmit`／`npm run lint`／`npm run build` 皆通過
- [x] 8.4 同步更新 `design.md`（決策 3 改寫為「所有節點一律套用」並記錄完整的三次來回變更歷程、新增 Risk 說明不再比照原始截圖的葉節點純姓名樣式）／`specs/admin-dashboard-monthly-report/spec.md`（Requirement 與 Scenario 改為不分條件）；`doc/管理者操作手冊.md`、`config/version.json`、`README-AI.md`、`ai-context/05-business-logic.md`、`ai-context/07-current-tasks.md`
