## 1. 資料模型與 migration

- [ ] 1.1 `prisma/schema/course-invite.prisma`：`InviteEnrollment` 新增 `materialBookName String?`
- [ ] 1.2 `prisma/schema/course-order.prisma`：新增 `MaterialShipmentItem { id、shipmentId(FK→MaterialShipment, cascade)、enrollmentId(FK→InviteEnrollment)、bookName String、version String、createdAt }`；`MaterialShipment.items[]`、`InviteEnrollment` 反向關聯
- [ ] 1.3 migration `add_material_book_items`（＋`materialBookName`）＋ `prisma generate`；系統未上線，必要時 `make dev-clean` 重置

## 2. 資料層（書本項目）

- [ ] 2.1 `lib/data/material-items.ts`（或 course-sessions/course-order）：`getCourseBookItems(inviteId)` → 已核准且 `materialChoice≠none` 報名清單 `{ enrollmentId, userId, studentDisplayName, bookName（materialBookName ?? 預設）, version }`
- [ ] 2.2 `lib/data/course-order.ts`：`ShipmentInfo`/型別擴充 `items`（含 bookName/version/學員名）；select 補 `items`
- [ ] 2.3 書本名字預設推導 helper（`realName || englishName || '匿名'`）

## 3. 學員申購書本名字

- [ ] 3.1 `app/actions/course-invite.ts`：`applyToCourse(inviteId, materialChoice, bookName?)` 接收；trim 空則預設；`materialChoice==='none'` 不需；寫入 `materialBookName`
- [ ] 3.2 `components/course-session/enrollment-application-dialog.tsx`：選繁/簡時顯示「書本名字」輸入欄，預帶預設（傳入或前端計算）；送出帶 bookName

## 4. 老師教材訂購：地址優先指派

- [ ] 4.1 `components/course-order/course-order-form.tsx` 多地址：改為「先新增地址（收件人＋門市/宅配）→ 列未指派書本項目 → 勾選指派」；每地址繁/簡由項目推導
- [ ] 4.2 `app/actions/course-order.ts`：建立/更新訂單時寫入 `MaterialShipmentItem`（快照 bookName/version）；由項目推導各 shipment `traditionalQty/simplifiedQty`；送出前驗證「全項目各指派一地址、不重複」
- [ ] 4.3 老師端寄送檢視：各地址顯示指派的學員名＋書本名字＋版本

## 5. 後台與列印顯示

- [ ] 5.1 `components/admin/material-order-table.tsx`：多地址各列顯示指派書本項目（學員名＋書本名字＋版本）；單一地址顯示全部項目
- [ ] 5.2 `admin/materials/[id]/print`：各地址出貨單帶出書本項目清單

## 6. 文件與版本

- [ ] 6.1 `doc/學員手冊.md`（申購填書本名字）、`doc/老師手冊.md`（教材訂購地址優先指派）、`doc/管理者操作手冊.md`（各地址書本清單）；版本標註
- [ ] 6.2 `config/version.json` patch +1；README-AI 同步

## 7. 驗證

- [ ] 7.1 `npm run build`、`npm run lint`、`npm run gen:zh-cn`（若動到文案）通過
- [ ] 7.2 （執行階段）申購書本名字預設/編輯/留白；老師地址優先指派、未指派不可送出；各地址學員清單；管理者/列印顯示
- [ ] 7.3 （部署）DB 套用 migration：本機 `make prisma-dev-deploy`（或 `make dev-clean` 重置）；VPS3 `make prisma-vps3-deploy`
