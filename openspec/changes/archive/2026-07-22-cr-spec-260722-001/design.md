## Context

教材版本目前是「繁體／簡體」兩態，貫穿整條書本項目鏈路：`InviteEnrollment.materialChoice`（enum，學員申請時選）→ 逐本項目（由已核准報名推導）→ 老師/管理者申請教材時可覆寫版本、加購 → `MaterialShipmentItem.version`（快照 String，非 enum）→ 依項目推導 `CourseOrder.traditionalQty/simplifiedQty` 與 `MaterialShipment.traditionalQty/simplifiedQty` → 前台進度顯示、後台教材管理列表/詳情、出貨單列印。

已確認範圍：僅擴充此「逐本書本項目」主線（`course-enrollment-application` / `material-book-items` / `course-multi-material-order` / `material-order-application` / `admin-material-management` / `print-shipping-order` / `material-multi-address-shipping` 七個 capability），**不含**另一套獨立的「課程訂購」舊表單（`lib/schemas/course-order.ts` 頂層 `courseOrderSchema`、Prisma `MaterialVersion` enum、`components/course-order/*`、`createCourseOrder`）——該表單的 `CourseOrderDialog` 未被任何頁面掛載（純死碼），故不動它，避免誤觸一個已無入口卻仍佔用 `MaterialVersion.both` 語意的舊機制。

系統已上線並有正式資料（見 memory: production-data-compat），所有 schema 變更須為向後相容的新增（新 enum 值、新欄位皆有預設值），不得改動既有欄位語意。

## Goals / Non-Goals

**Goals:**
- 學員申請課程時，「選擇書籍」可選：無須購買／繁體／簡體／**英文**。
- 老師/管理者申請教材時，逐本項目版本可覆寫為英文；可加購英文書。
- 訂單、寄送批次、進度統計、後台列表、出貨單列印，皆正確統計並呈現英文本數與英文書本清單。
- 新增的 enum 值與欄位對既有資料完全相容（現有 `none`/`traditional`/`simplified` 記錄與訂單不受影響）。

**Non-Goals:**
- 不支援英文以外的其他語言（不做成可任意擴充的語言清單／設定表，維持與現有 traditional/simplified 相同的「命名欄位」風格）。
- 不處理獨立的「課程訂購」舊表單（`courseOrderSchema`/`MaterialVersion`/`CourseOrderDialog`）——該路徑目前無入口，本次不修改、不新增英文選項。
- 不追溯修改既有 `InviteEnrollment`/`CourseOrder`/`MaterialShipment` 歷史記錄。
- 不將 `MaterialShipmentItem.version` 由 String 快照改為 Prisma enum（維持現況設計，只是允許值多一種）。

## Decisions

### 1. `MaterialChoice` enum 新增 `english`（而非拆成獨立欄位或語言表）
延續現有「單一 enum 表示書籍需求」設計；`InviteEnrollment.materialChoice` 直接新增 `english` 值。
- 替代方案：改用 `language` + `needsBook Boolean` 兩欄位，更彈性但要動全部既有查詢與 UI 判斷式，且非本次需求（僅需再多一種版本）。維持 enum 擴充成本最低、風格一致。

### 2. `MaterialShipmentItem.version` 維持 String 快照，不建 Prisma enum
該欄位本就是 `String`（見 `prisma/schema/course-order.prisma:167` 註解「版本快照（traditional / simplified）」），新增 `'english'` 只需放寬 Zod 允許值（`orderBookItemInputSchema.version`），schema 本身不必變動。
- 替代方案：改為 Prisma enum 以獲得型別安全。評估後認為此欄位本質是「當下版本文字快照」，不需要 DB 層級約束，改 enum 屬於範圍外的重構，故不做。

### 3. `CourseOrder`／`MaterialShipment` 新增 `englishQty Int @default(0)`
與既有 `traditionalQty`/`simplifiedQty` 並列（非改造成 JSON/陣列），維持既有「由書本項目推導」的計算風格與既有讀取程式碼的一致性。
- 替代方案：改成 `Json` 欄位存 `{traditional, simplified, english}` 或建立 `MaterialOrderVersionCount` 子表，彈性更高但會牽動所有既有讀取/顯示程式碼與既有資料遷移，超出「加一種版本」的實際需求，故不採用。

### 4. 統計/推導邏輯由二元組擴充為三元組（具名欄位，非陣列/Map）
`lib/utils/material-progress.ts` 的 `MaterialCount` 型別新增 `english: number`；`computeMaterialProgress` 的 reduce 初始值與運算同步擴充第三個具名欄位。`lib/data/course-order.ts`、`lib/data/course-sessions.ts` 內對應的加總/推導函式比照辦理。
- 替代方案：改為 `Record<MaterialVersionKey, number>` 動態結構，日後若再加語言可少改一點程式碼，但當下會讓既有呼叫端（皆以 `.traditional`/`.simplified` 存取）全部要跟著改型別存取方式，改動面更大且無立即效益，故維持具名欄位、比照現有寫法新增一個。

### 5. UI 選項順序：英文教材排在「簡體教材」之後（第四位）
學員選書 Dialog、老師/管理者版本下拉選單，新增選項一律加在既有選項之後，不重排既有選項順序。
- 理由：避免既有使用者（老師/管理者）因選項順序变動而誤選；符合「新增」而非「改版」的變更性質。

### 6. i18n key 命名比照既有 traditional/simplified 對稱補齊
`messages/zh-TW.json` 的 `course.material.*`（`english`、`versionShortEnglish`）與 `course.enroll.*`（`engDesc`）等 key，命名與既有 `traditional`/`simplified` 對稱 key 一一對應，`messages/en.json` 同步補譯；`messages/zh-CN.json` 不手改，變更後執行 `npm run gen:zh-cn` 重新產生。

## Risks / Trade-offs

- **[風險] Postgres enum 新增值需透過 migration，且 `ALTER TYPE ... ADD VALUE` 在同一交易內有限制** → 緩解：一律用 `make schema-update` 走 `prisma migrate dev` 標準流程產生 migration，不手動下 SQL；套用後以 `make prisma-status` 確認。
- **[風險] 遺漏假設「僅二選一」的隱藏角落**（例如某處以陣列長度 2、或以 `traditional/simplified` 互斥判斷做 UI 版面配置、或匯出/報表寫死兩欄）→ 緩解：實作前以 `grep -rn "traditionalQty\|simplifiedQty\|MaterialChoice\|materialChoice"` 全面列出所有命中檔案逐一檢查，於 tasks.md 逐檔列為子任務，而非只改「主線」檔案。
- **[風險] `MaterialShipmentItem.version` 為自由 String 快照，Zod 放寬後若前端傳入非三選一以外的值會直接落地** → 緩解：所有寫入路徑（`orderBookItemInputSchema`）皆經 Zod enum 驗證，不開放自由文字。
- **[風險] i18n `zh-CN` 遺漏重新產生，新 key 顯示簡體介面時 fallback 回繁體**（可接受但非預期）→ 緩解：實作完成後於 tasks.md 明列 `npm run gen:zh-cn` 步驟。
- **[取捨] 未將版本設計改為可設定的語言清單** → 若日後真的需要支援第四種語言，屆時需重新評估是否值得做成資料驅動設計；本次基於當前唯一新增需求（英文）判斷不值得提前做這個彈性。

## Migration Plan

1. `prisma/schema/course-invite.prisma`：`MaterialChoice` enum 新增 `english`。
2. `prisma/schema/course-order.prisma`：`CourseOrder`、`MaterialShipment` 新增 `englishQty Int @default(0)`。
3. `make schema-update name=add_english_material_choice` 產生並套用 migration（本地開發庫）。
4. 依 tasks.md 逐一調整 Zod schema、data layer、actions、UI、i18n。
5. `npm run gen:zh-cn` 重新產生簡體語系檔。
6. `npm run build` + `npm run lint` 驗證。
7. 正式環境依現行流程：`make tunnel-vps3` → `make prisma-vps3-status` → `make prisma-vps3-deploy`（新增值/新增欄位皆為向後相容，無需資料回填）。

無需 rollback 特殊處理：新增 enum 值與新增欄位（有預設值）皆不影響既有資料與既有程式碼路徑；如需回退，僅需回退程式碼即可（enum 值多一個不影響舊程式碼運作，`englishQty` 欄位不使用時保持 0）。

## Open Questions

- 教材需求統計卡片、後台列表、出貨單列印的文案排列（例如「繁 X / 簡 Y / 英 Z」的呈現順序與斷行），將於 tasks 實作時比照現有版面風格微調，不預先於此定案。
