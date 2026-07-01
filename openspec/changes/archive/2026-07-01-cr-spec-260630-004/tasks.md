## 1. 資料模型與 migration

- [x] 1.1 `prisma/schema/course-order.prisma`：`CourseOrder` 新增 `note String?`（單一地址備註）；`MaterialShipment` 新增 `note String?`（各地址備註）
- [x] 1.2 migration `20260630000000_add_material_order_notes`（兩個 nullable note 欄）＋ `prisma generate` 重生 client（DB 套用見 7.4）

## 2. 資料層

- [x] 2.1 `lib/data/course-order.ts`：`shipmentSelect` 加 `note`；order select 加 `note`、`recipientName`/`recipientPhone`（單一地址）；課程編號沿用既有 `inviteId`
- [x] 2.2 型別 `ShipmentInfo` 補 `note`；`CourseOrderDetail`/`CourseOrderWithInvite`/`CourseOrderForPrint` 補 `note`（及單一地址 recipient）

## 3. Server Action（備註）

- [x] 3.1 `app/actions/course-order.ts`：新增 `updateMaterialAddressNote`（`{ orderId }`(single) 或 `{ shipmentId }`(multiple) + `note`）；更新對應 `note`、`revalidatePath('/admin/materials')`、回傳 `ActionResponse`
- [x] 3.2 守衛：`auth()` + `canAccessAdmin`，僅後台/管理者可呼叫

## 4. 列表元件（`components/admin/material-order-table.tsx`）

- [x] 4.1 移除「教材版本」「數量」`<th>/<td>`，並移除未使用的 `MATERIAL_VERSION_LABELS`
- [x] 4.2 新增「課程編號」欄：`order.inviteId ? '#' + inviteId : '—'`
- [x] 4.3 展開詳情列 `colSpan` 由 11 改為 10
- [x] 4.4 single 區塊：顯示收件人姓名＋電話（空值「—」）＋可編輯備註（`CourseOrder.note`）
- [x] 4.5 multi 地址列：每列加收件人姓名＋電話＋可編輯備註（`MaterialShipment.note`）
- [x] 4.6 `AddressNoteEditor`（textarea＋儲存）呼叫 3.1；成功 toast＋`router.refresh()`

## 5. 列印出貨單

- [x] 5.1 `admin/materials/[id]/print`：各份出貨單帶上該地址備註（收件人原已具備）

## 6. 文件與版本

- [x] 6.1 更新 `doc/管理者操作手冊.md`（列表欄位移除版本/數量、加課程編號、收件人顯示、各地址內部備註、列印帶備註）＋檔首版本 v0.1.106；老師/學員手冊不受影響（備註不外露前台）
- [x] 6.2 `config/version.json` → 0.1.106；README-AI 當前任務同步

## 7. 驗證

- [x] 7.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）通過
- [x] 7.2 （執行階段，需 DB＋seed）single 與 multi 各加備註 → 重整後持久；前台（老師訂單檢視）不顯示備註
- [x] 7.3 （執行階段）列表無「教材版本/數量」欄、「課程編號」正確（含獨立訂單「—」）；single/multi 收件人姓名＋電話正確
- [x] 7.4 （部署）DB 套用 migration：本機 `make prisma-dev-deploy`；VPS3 `make prisma-vps3-deploy`
