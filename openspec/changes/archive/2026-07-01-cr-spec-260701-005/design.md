## Context

- 003：多地址訂單為各書建 `MaterialShipmentItem`（bookName/version 快照，**無 studentName**）；單一地址不建 shipment/item。
- 004：單一地址以 `getCourseBookItems` 推導顯示書本清單（治標）；多筆單一訂單無法區分歸屬。
- `getUnassignedBookItems(inviteId)`＝課程書本項目扣除已在任何 `MaterialShipmentItem` 者（＝本次新訂單涵蓋範圍）。

## Goals / Non-Goals

**Goals:**
- 每筆訂單（含單一地址）記錄其涵蓋的書本項目，歸屬明確。
- 顯示（後台/列印）單/多地址一致，含學員名。

**Non-Goals:**
- 不改老師端單一地址操作（仍是選「單一地址」即把其餘全部寄此處，不需逐本勾選）。
- 不改金流/寄送狀態機（單一地址仍以訂單層 `shippedAt` 確認）。

## Decisions

1. **模型**：`MaterialShipmentItem` 新增 `studentName String`（指派時快照）。migration `add_shipment_item_student_name`。
2. **單一地址建立批次＋項目**（`applyMaterialOrder` single 分支）：
   - 取當下 `getUnassignedBookItems(inviteId)` 作為本訂單涵蓋書本。
   - 建立 `CourseOrder`（維持自身地址欄位）＋建立**一個** `MaterialShipment`（鏡射該地址、qty 由項目推導）＋為每本書建 `MaterialShipmentItem`（快照 bookName/version/studentName）。
   - 若無未指派書本則維持既有「已全部申請」防呆。
3. **多地址項目**：建 `MaterialShipmentItem` 時一併快照 `studentName`（來源 `getUnassignedBookItems` 之項目）。
4. **顯示來源統一**：`lib/data/course-order.ts` 之 `ShipmentInfo.items` 加 `studentName`；訂單書本清單一律取自「該訂單各 `MaterialShipment.items`」。單一地址因now有自己的 shipment，其書本＝該 shipment 的 items（精準對應本訂單）。移除 004 的 `getCourseBookItems`/`bookItems` 推導（single `bookItems` 改為該訂單 shipment items 的攤平）。
5. **顯示端**：`material-order-table`（單一區塊、多地址列）與列印頁，皆顯示「學員名（書本名字）· 繁/簡」。單一地址區塊的書本清單改讀其自身 shipment items。

## Risks / Trade-offs

- **單一地址現在會有一筆 `MaterialShipment`**：批次寄送確認邏輯僅對 `shipMode==='multiple'` 觸發，單一訂單仍走訂單層確認，故該 shipment 不會被逐批確認（其 `shippedAt` 恆 null，僅作項目容器）。需確認顯示端不把單一訂單誤當多地址列出。
- migration 為新增欄（studentName），非破壞性；系統未上線可重置。
- 老師端單一地址 UX 不變（自動涵蓋其餘全部）。
