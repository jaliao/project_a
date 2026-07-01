## Why

004 讓單一地址訂單顯示書本清單，但來源用「課程全部/未指派」推導，屬治標：當同課程先後有**多筆**寄送（例：課程 347 寄送編號 6、7、8，含多地址與之後補的單一地址），無法分辨「哪些書屬於哪一批寄送」——因為**單一地址訂單並未記錄它實際涵蓋哪些書**。需治本：**每一筆訂單（含單一地址）都記錄其涵蓋的書本項目**，使歸屬明確、顯示精準。

## What Changes

- **單一地址也建立寄送批次與書本項目**：`applyMaterialOrder` 的 single 分支，除訂單自身地址外，另建一個 `MaterialShipment`（鏡射該地址）並為當下「尚未指派」的每本書建立 `MaterialShipmentItem`（快照）。每筆單一訂單各自擁有自己的書本紀錄。
- **`MaterialShipmentItem` 新增 `studentName` 快照**：指派時一併快照學員名稱，供顯示（多地址亦受惠，現況只有書本名字）。migration。
- **顯示統一**：後台教材詳情與出貨單列印，一律讀「該訂單各寄送批次的書本項目」（單一與多地址一致），顯示「學員名（書本名字）· 繁/簡」。移除 004 以 `getCourseBookItems` 推導的做法。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `material-book-items`: 每筆訂單（含單一地址）記錄自身涵蓋之書本項目；單一地址亦建立寄送批次與 `MaterialShipmentItem`；項目快照含學員名。
- `material-multi-address-shipping`: 書本項目快照新增學員名稱。
- `admin-material-management`: 後台詳情與列印顯示各批次「學員名＋書本名字＋版本」（單/多地址一致）。

## Impact

- `prisma/schema/course-order.prisma`：`MaterialShipmentItem` 新增 `studentName String` → migration `add_shipment_item_student_name`
- `app/actions/course-order.ts`：single 建立 shipment＋items；multi 建 items 時快照 studentName
- `lib/data/course-order.ts`：`ShipmentInfo.items` 加 `studentName`；single 訂單書本清單改由其自身寄送批次項目取得（移除 `getCourseBookItems` 推導）
- `components/admin/material-order-table.tsx`、列印頁：顯示學員名（書本名字）· 版本（單/多一致）
- `doc/管理者操作手冊.md`、`config/version.json`、README-AI
- 系統未上線、無舊資料：可 `make dev-clean` 重置後套用 migration
