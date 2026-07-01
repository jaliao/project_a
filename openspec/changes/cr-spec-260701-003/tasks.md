## 1. 資料模型與 migration

- [x] 1.1 `InviteEnrollment.materialBookName String?`
- [x] 1.2 `MaterialShipmentItem`（shipmentId cascade、enrollmentId、bookName、version）＋反向關聯
- [x] 1.3 migration `20260701030000_add_material_book_items` ＋ generate（DB 套用見 7.3）

## 2. 資料層（書本項目）

- [x] 2.1 `lib/data/material-items.ts`：`getCourseBookItems`＋`getUnassignedBookItems`
- [x] 2.2 `lib/data/course-order.ts`：`ShipmentInfo.items`（`ShipmentItemInfo`）；`shipmentSelect` 補 items
- [x] 2.3 `defaultBookName`／`getDefaultBookNameForUser`

## 3. 學員申購書本名字

- [x] 3.1 `applyToCourse(inviteId, materialChoice, bookName?)`（空則預設、none 不需、寫 materialBookName）
- [x] 3.2 `enrollment-application-dialog`：選繁/簡顯示書本名字欄、course/[id] 頁預帶預設；`course.enroll.bookName*` i18n

## 4. 老師教材訂購：地址優先指派

- [x] 4.1 `shipmentItemSchema`：qty → `enrollmentIds`；`material-order-dialog` 多地址改「地址＋書本項目勾選」（BookAssignList）、qty 由勾選推導、全指派才可送出
- [x] 4.2 `applyMaterialOrder` 多地址：建 `MaterialShipmentItem`（快照 bookName/version）、推導各 shipment qty、驗證有效/不重複/全指派
- [x] 4.3 thread `bookItems`（course/[id] 頁 `getUnassignedBookItems` → CourseDetailActions → MaterialOrderDialog）

## 5. 後台與列印顯示

- [x] 5.1 `material-order-table`：多地址各列顯示書本清單（書本名字＋繁/簡）
- [x] 5.2 `admin/materials/[id]/print`：各地址出貨單帶書本清單

## 6. 文件與版本

- [x] 6.1 學員/老師/管理者手冊（書本名字、地址優先指派、各地址書本清單）＋版本 v0.1.111
- [x] 6.2 `config/version.json` → 0.1.111；README-AI 同步

## 7. 驗證

- [x] 7.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）、`npm run gen:zh-cn` 通過
- [ ] 7.2 （執行階段）申購書本名字預設/編輯；老師地址優先指派、未全指派不可送出；各地址學員清單；後台/列印顯示
- [ ] 7.3 （部署）DB 套用 migration：本機 `make prisma-dev-deploy`（或 `make dev-clean` 重置）；VPS3 `make prisma-vps3-deploy`
