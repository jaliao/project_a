## Context

- 003 讓多地址訂單以 `MaterialShipment.items`（`MaterialShipmentItem`）逐本呈現；後台表格與列印的多地址列已顯示書本清單。
- 單一地址（`shipMode = single`）**無 shipment/item**，訂單以自身寄件欄位存址、`traditionalQty/simplifiedQty` 存數量；後台/列印只顯示數量。
- `lib/data/material-items.ts` 已有 `getCourseBookItems(inviteId)`（已核准且 `materialChoice≠none` 的報名 → `{ studentName, bookName, version }`）。

## Goals / Non-Goals

**Goals:**
- 單一地址訂單於後台詳情與出貨單列印顯示書本清單（學員名＋書本名字＋版本）。

**Non-Goals:**
- 不改寫入模型／不建 shipment/item（單一地址仍沿用訂單自身欄位）；無 migration。
- 不改多地址現狀。

## Decisions

1. **書本清單來源**：單一地址訂單的書本清單＝`getCourseBookItems(order.courseInviteId)`（該課程全部申購書本，視為全數送至此單一地址）。無 `courseInviteId`（獨立訂單）則為空。
2. **資料層附掛**：`lib/data/course-order.ts` 於 `getAllCourseOrdersWithInvite` 與 `getCourseOrderForPrint`，當 `shipMode = single` 時，以 `getCourseBookItems` 取得清單，掛於回傳型別新增欄位 `bookItems: { studentName; bookName; version }[]`（多地址時為空陣列，沿用 `shipments[].items`）。
3. **顯示**：
   - `material-order-table` 單一地址詳情區塊：於「書本數量（繁/簡）」下方列出書本清單（學員名（書本名字）· 繁/簡）。
   - 列印頁單一地址 slip：於 `items` 帶入 `order.bookItems`（現為空），沿用 003 已加的「書本清單」呈現。

## Risks / Trade-offs

- **多訂單情境**：單一地址顯示課程全部書本項目；若同課程另有多地址訂單已分走部分書，單一地址仍列全部（過度呈現）。屬罕見混用；系統未上線，可接受，必要時後續以「未被 shipment 指派者」精算。
- 純顯示、無 migration、無寫入變更，風險低。
- `getCourseBookItems` 於列表每筆單一地址訂單各查一次；訂單量小可接受（必要時批次化）。
