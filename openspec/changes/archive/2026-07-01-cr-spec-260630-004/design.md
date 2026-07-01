## Context

後台教材申請列表 = `app/[locale]/(admin)/admin/materials/page.tsx` + `components/admin/material-order-table.tsx`，資料層 `lib/data/course-order.ts`（型別 `CourseOrderWithInvite`）。

- 列表欄：編號 / 課程名稱 / 講師 / 購買人 / **教材版本** / **數量** / 申請時間 / 狀態 / 操作 / 出貨單。
- 展開詳情（`OrderDetail`）：購買人快照、批價/收款、寄送區。
  - `shipMode = single`：顯示「書本數量 繁X/簡Y」「取貨方式 — 門市（店號）」。
  - `shipMode = multiple`：逐批列「取貨方式 — 門市（店號）　繁X/簡Y」＋確認寄送。
- 資料層**已 select** `recipientName`/`recipientPhone`（order 與 shipment），但 multi 地址列與 single 區塊**皆未呈現**收件人。
- 模型：`CourseOrder`（single 自帶寄件欄位＋recipientName/Phone）、`MaterialShipment`（multi，每批 recipientName/Phone/store/qty）。**兩者皆無備註欄**。

## Goals / Non-Goals

**Goals:**
- 列表移除「教材版本」「數量」欄、新增「課程編號（#courseInviteId）」欄。
- single 與 multi 的收件資訊皆顯示**收件人姓名＋聯絡電話**。
- 各收件地址可加**備註**（single→訂單；multi→每批），詳情可檢視與編輯。

**Non-Goals:**
- 不改前台教材申請流程/欄位、不動金流（批價/收款/寄送狀態機）。
- 不改 single/multiple 寄送邏輯本身。
- 不做 i18n（後台維持繁體）。

## Decisions

1. **課程編號** = `order.courseInviteId`，顯示 `#<id>`；獨立訂單（無 courseInvite）顯示「—」。`CourseOrderWithInvite` 型別與 order select 補 `courseInviteId`。
2. **備註＝各收件地址一則**，分兩模型承載「一個收件地址＝一則」：
   - `single` → `CourseOrder.note`（單一地址即訂單本身）。
   - `multiple` → `MaterialShipment.note`（每批一則）。
   - 兩模型各新增 `note String?` → 透過 `make schema-update` 建 migration（非破壞性，既有資料為 null）。
3. **列表欄位調整**（`material-order-table.tsx` thead/tbody）：移除「教材版本」「數量」對應 `<th>/<td>`；於「課程名稱」欄旁新增「課程編號」欄；展開列 `colSpan` 由 11 同步調整。
4. **收件資訊呈現**（`OrderDetail`）：
   - multi 地址列：於現有「取貨方式 — 門市（店號）　繁X/簡Y」後，加「收件人：姓名・電話」與「備註」。
   - single：於書本數量/取貨方式區塊加「收件人：姓名・電話」與「備註」。
5. **備註編輯**：新增 server action（如 `updateMaterialAddressNote`），參數區分 `{ orderId }`（single）或 `{ shipmentId }`（multiple）更新對應 `note`；沿用 `ActionResponse` + `revalidatePath('/admin/materials')`。UI 以詳情列內小型可編輯欄（textarea ＋ 儲存鈕）。
6. **資料層**：`shipmentSelect` 加 `note`；order select 加 `note`、`courseInviteId`；型別 `ShipmentInfo` / `CourseOrderWithInvite` 同步補欄。
7. **列印出貨單**（`/admin/materials/[id]/print`）：一併帶上各地址收件人＋備註（撿貨用）。若改動過大則切為後續 follow-up，本批至少不破壞既有列印。

## Risks / Trade-offs

- 備註分散於 `CourseOrder` 與 `MaterialShipment` 兩處 → 呈現/儲存需依 `shipMode` 分支；惟既有 single/multi 已分支處理，增量成本可控。
- 移除列表「教材版本／數量」欄改變掃描習慣，但資訊仍保留在展開詳情，不致遺失。
- migration 僅加兩個 nullable 欄，非破壞性；無需資料回填。
- `courseInviteId` 對獨立訂單為 null（顯示「—」），與既有「課程名稱」欄的 `—` 行為一致。
