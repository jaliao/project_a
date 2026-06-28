## Context

cr-spec-260628-002 完成後，講師端 `course-detail-actions.tsx` 已能逐筆列出多筆教材訂單，但：
- 看不到「整門課教材的申請進度」（總需求 / 已申請 / 尚未申請）。
- 每筆訂單只顯示金流狀態，看不到該筆實際申請的書籍種類與數量。
- 單一地址訂單**沒有**任何書籍數量（`CourseOrder.quantity` 為廢棄欄位＝0）；只有多地址訂單的 `MaterialShipment` 有 `traditionalQty`/`simplifiedQty`。

課程教材總需求已有來源：`getEnrollmentMaterialSummary(inviteId)` 回傳已核准學員的 `{ traditional, simplified }`。

本變更要：把每筆訂單補上繁/簡數量、用它算出申請進度、把操作區重整為三段式區塊，並用進度限制申請按鈕。

## Goals / Non-Goals

**Goals:**
- 每筆 `CourseOrder` 記錄繁/簡數量（單一＋多地址皆有）。
- 課程詳情顯示 總需求／已申請／尚未申請（繁、簡分列）。
- 講師操作區改為三區塊（教材申請／開始上課／取消上課）上下堆疊，每塊「標題→說明→動作」。
- 申請按鈕僅在「尚未申請 > 0」可按；單筆申請不可超過剩餘量。

**Non-Goals:**
- 不改金流各階段（批價／付款／寄送／收件）規則。
- 不改開課門檻邏輯（沿用 cr-spec-260628-002 的 `evaluateCourseStartGate`）—僅把它放進「開始上課作業」區塊的說明。
- 不恢復 cr-spec-260628-002 移除的「多地址總和需等於課程總計」硬性驗證；總計只作為**進度與申請上限**。

## Decisions

**決策 1：`CourseOrder` 新增 `traditionalQty` / `simplifiedQty`（Int, 預設 0）。**
- 代表「該筆申請的繁/簡本數」。單一地址即為該筆全部；多地址則為各批次加總。
- *替代方案*：沿用 `quantity` 單一欄位 → 否決，無法區分繁/簡，且該欄位語意已廢棄。

**決策 2：多地址內部一致性 = 批次加總等於訂單繁/簡數量。**
- `applyMaterialOrder` 多地址時：`sum(shipments.traditionalQty) === order.traditionalQty` 且簡體亦同；不一致則拒絕。
- 與課程總需求**不再**比對（沿用 002 決策），總需求僅供進度/上限。

**決策 3：進度計算集中於資料層／頁面。**
- 總需求：`getEnrollmentMaterialSummary(inviteId)` → `{ traditional, simplified }`。
- 已申請：該課程所有 `orders` 的 `traditionalQty`/`simplifiedQty` 加總。
- 尚未申請：`max(0, 總需求 − 已申請)`（繁、簡各自計算）。
- `canApplyMore = (剩餘繁 + 剩餘簡) > 0`。
- 於 `lib/data/course-sessions.ts` 或 `page.tsx` 衍生，傳給 UI 與申請 Dialog（剩餘量用於輸入上限）。

**決策 4：單一地址自動帶剩餘；多地址手動分配；皆不可超額。**
- **單一地址**：不需手動填數量，`applyMaterialOrder` 以**當下 DB 重算的「尚未申請」剩餘繁/簡**寫入該訂單（等同「剩餘全部寄一處」）。申請 Dialog 單一地址模式以唯讀方式顯示「本次將申請：繁 X、簡 Y」。
- **多地址**：講師於各地址分配繁/簡，Dialog 顯示剩餘量，各批次加總 = 訂單繁/簡數量，且總和 `<= 剩餘`。
- `applyMaterialOrder` server 端一律以**當下 DB 重算剩餘**驗證上限（避免並發超額），不信任前端傳入的剩餘。
- 單筆至少需 1 本（沿用 002 的「≥1 本」）。

**決策 4b：前台與後台皆呈現每筆訂單繁/簡數量。**
- 前台：`course-detail-actions.tsx` 訂單清單每筆顯示「繁 X、簡 Y」。
- 後台：`lib/data/course-order.ts` 的 `CourseOrderWithInvite` / `CourseOrderForPrint` 帶 `traditionalQty`/`simplifiedQty`；`material-order-table.tsx` 列表/詳情與出貨單列印頁顯示。

**決策 5：三區塊 UI 結構。**
- 重整 `course-detail-actions.tsx` 為三個 `section`，每塊統一「標題 + 說明 + 動作」：
  1. 教材申請作業：說明＝進度摘要（總/已/未，繁簡分列）＋ 訂單清單（每筆顯示繁X 簡Y ＋ 狀態 badge ＋ 查看/回填/確認收件）；動作＝「申請教材」（`canApplyMore` 為 false 時停用，附剩餘=0 提示）。
  2. 開始上課作業：說明＝注意事項＋未達門檻原因（`startReasons`）；動作＝「開始上課」（`canStart` 為 false 時停用）。
  3. 取消上課作業：說明從簡；動作＝「取消授課」。

**決策 6：migration 回填既有訂單繁/簡數量。**
- 新欄位預設 0。多地址既有訂單可由 `material_shipments` 加總回填；單一地址既有訂單無來源，維持 0（屬歷史資料，講師可重新申請或忽略）。
- 依 CLAUDE.md 以 `make schema-update name=add_course_order_book_qty` 建立 migration；回填 SQL 併入。

## Risks / Trade-offs

- [既有單一地址訂單回填無來源，數量為 0 → 進度顯示「已申請」偏低] → 屬歷史資料；新申請皆會帶數量。可於說明標註，必要時由管理者調整。
- [並發申請可能超額] → server 端以當下 DB 重算剩餘再驗證，而非信任前端傳入的剩餘。
- [總需求隨學員核准而變動] → 進度為即時計算；若學員增加，尚未申請>0 時申請按鈕自動恢復可按。

## Migration Plan

1. schema 加 `traditionalQty`/`simplifiedQty`（預設 0）。
2. `make schema-update name=add_course_order_book_qty`；migration 內回填多地址訂單（由 shipments 加總）。
3. 改 schema 驗證、action、資料層、UI；`npm run build` 通過。
4. 部署：`make prisma-dev-status` → `make prisma-dev-deploy`。
5. 回滾：還原 schema 與程式碼、移除該 migration。

## Open Questions

- 既有單一地址訂單是否需要人工補繁/簡數量？目前預設不補（維持 0），如需精確歷史進度再追加管理工具。
