## 1. 資料模型（Prisma）

- [x] 1.1 `prisma/schema/course-order.prisma`：`CourseOrder` 新增 `recipientName String?`、`recipientPhone String?`（單一地址收件人／連絡電話）
- [x] 1.2 同檔 `MaterialShipment` 新增 `recipientName String?`、`recipientPhone String?`（多地址各批次收件人／連絡電話）
- [x] 1.3 產生 migration（`20260621154511_add_order_recipient_contact`）並重新生成 client；已將欄位套用至 dev DB（env 阻擋 `make schema-update` 走容器，改直接套用）

## 2. 驗證 Schema（Zod）

- [x] 2.1 在教材申請 Zod schema（`lib/schemas/`）的寄送批次陣列項目新增 `recipientName`、`recipientPhone`，驗證非空字串
- [x] 2.2 單一地址欄位新增 `recipientName`、`recipientPhone`（可空，由 server 以講師資料回填）

## 3. Server Action

- [x] 3.1 `applyMaterialOrder`：`shipMode == single` 時，將 `recipientName`／`recipientPhone` 寫入 CourseOrder；空值時以申請講師 `User.realName`（fallback `User.name`）與 `User.phone` 回填
- [x] 3.2 `shipMode == multiple` 時，建立各 `MaterialShipment` 一併寫入該批次的 `recipientName`／`recipientPhone`；任一批次缺收件人或連絡電話則回傳失敗、不建立批次
- [x] 3.3 更新現有訂單路徑（update）一併寫入新欄位

## 4. 申請表單 UI

- [x] 4.1 單一地址區新增「收件人」「連絡電話」輸入欄位，載入時預設帶入登入講師姓名與 `User.phone`，可修改
- [x] 4.2 多地址清單每個地址列新增「收件人」「連絡電話」必填輸入欄位，與寄件方式／地址／本數並列
- [x] 4.3 前端驗證：多地址任一地址缺收件人或連絡電話時，阻擋送出並提示（zodResolver min(1) + FormMessage）

## 5. 出貨單列印頁

- [x] 5.1 `/admin/materials/[id]/print`：單一地址出貨單新增「收件人」「連絡電話」列，取自 `CourseOrder.recipientName`／`recipientPhone`
- [x] 5.2 多地址各批次出貨單新增「收件人」「連絡電話」列，取自對應 `MaterialShipment`
- [x] 5.3 收件人／連絡電話為 null 或空白時顯示「（未填）」

## 6. 驗證

- [x] 6.1 `npm run build` 通過（tsc 無錯誤）；`npm run lint` 因專案 ESLint 9 設定缺失而無法執行（既有問題，非本變更）
- [x] 6.2 單一地址申請：確認預設帶入講師姓名／電話、可修改、出貨單正確顯示
- [x] 6.3 多地址申請：每個地址填不同收件人／電話，確認各批次儲存正確、出貨單分頁各自顯示
- [x] 6.4 邊界：多地址留空收件人／電話時被擋下；既有舊資料出貨單顯示「（未填）」不報錯

## 7. 收尾

- [x] 7.1 依 CLAUDE.md 第 9 點更新 `doc/老師手冊.md`（申請流程新增收件人／連絡電話）與 `doc/管理者操作手冊.md`（出貨單欄位），更新檔首版本與日期（→ v0.1.81）
- [x] 7.2 apply 時將 `config/version.json` patch 版本號 +1（0.1.80 → 0.1.81）
