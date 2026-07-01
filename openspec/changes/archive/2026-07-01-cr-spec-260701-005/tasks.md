## 1. 資料模型與 migration

- [x] 1.1 `MaterialShipmentItem` 新增 `studentName String @default("")`
- [x] 1.2 migration `20260701040000_add_shipment_item_student_name` ＋ generate（DB 套用見 6.3）

## 2. Server Action（applyMaterialOrder）

- [x] 2.1 多地址：建 `MaterialShipmentItem` 快照 `studentName`
- [x] 2.2 單一地址：取 `getUnassignedBookItems`；建訂單＋一個 `MaterialShipment`（鏡射地址、qty 由項目推導）＋逐本項目（快照 bookName/version/studentName）
- [x] 2.3 無未指派書本維持既有防呆（qty 由項目推導）

## 3. 資料層

- [x] 3.1 `ShipmentItemInfo` 加 `studentName`；`shipmentSelect` 補 `studentName`
- [x] 3.2 單一地址 `bookItems` 改由其自身 `shipments[].items` 攤平；移除 `getCourseBookItems` 顯示推導（import 已移除）

## 4. 顯示（後台表格＋列印）

- [x] 4.1 `material-order-table`：多地址列與單一地址區塊皆顯示「學員名（書本名字）· 繁/簡」
- [x] 4.2 列印頁：多地址與單一地址 slip 皆帶學員名（多地址 slip items 改用 `it.studentName`）

## 5. 文件與版本

- [x] 5.1 `doc/管理者操作手冊.md`：各批次含學員名、單一地址記錄自身批次、多筆歸屬明確；版本 v0.1.113
- [x] 5.2 `config/version.json` → 0.1.113；README-AI 同步

## 6. 驗證

- [x] 6.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）通過
- [ ] 6.2 （執行階段，參考課程 347 寄送 6/7/8）多筆先後寄送書本各自歸屬、含學員名；單一地址不混入他筆
- [ ] 6.3 （部署）`make prisma-dev-deploy`（或 `make dev-clean` 重置）；VPS3 `make prisma-vps3-deploy`
