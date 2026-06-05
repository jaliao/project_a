## 1. 資料模型與 Migration

- [x] 1.1 `prisma/schema/course-order.prisma` 新增 `enum ShipMode { single multiple }`，`CourseOrder` 加 `shipMode ShipMode @default(single)` 與 `shipments MaterialShipment[]`
- [x] 1.2 新增 `MaterialShipment` model：`courseOrderId`(relation, onDelete Cascade)、`deliveryMethod`、`deliveryAddress?`、`storeId?`、`storeName?`、`traditionalQty Int @default(0)`、`simplifiedQty Int @default(0)`、`shippedAt DateTime?`、`createdAt`
- [x] 1.3 套用 schema 至 dev DB 並重生 client（因 migration 歷史漂移改用 `prisma db push`，純附加無資料遺失；正式 migration 檔待漂移處理）

## 2. 應寄本數統計

- [x] 2.1 將 approved 學員 `materialChoice` 統計（繁體/簡體本數）抽成可重用 helper（沿用 `lib/data/course-sessions.ts` 邏輯），供表單與 action/列印共用

## 3. Schema 驗證與 Server Actions

- [x] 3.1 `lib/schemas/course-order.ts` 新增 `shipMode` 與 `shipments[]`（每筆寄件方式/地址/門市/繁體數/簡體數）結構驗證；超商批次門市必填
- [x] 3.2 `applyMaterialOrder` 接收 `shipMode`/`shipments`；`multiple` 時於 `$transaction` 刪除未寄送批次後重建，並以 server 端應寄本數權威驗證「繁/簡本數總和相等」，不符回傳失敗
- [x] 3.3 `applyMaterialOrder` 多地址訂單若已有任一批次寄送則拒絕修改（延伸「已寄送禁止修改」至批次層級）；`single` 路徑行為不變
- [x] 3.4 新增 `confirmShipmentBatch(shipmentId)`：設該批次 `shippedAt`；若該訂單所有批次皆已寄送，於同一 transaction 設 `CourseOrder.shippedAt`；含 admin 權限驗證
- [x] 3.5 確認 `confirmShipment(orderId)`（單一）與 `confirmReceipt` 行為不變

## 4. UI

- [x] 4.1 教材申請表單新增「寄送方式」單選（單一地址／多個地址）；單一維持現行表單
- [x] 4.2 多地址動態清單：每列 `EcpayStoreSelector`（超商）或宅配地址 + 繁體/簡體數量輸入，可新增/刪除
- [x] 4.3 多地址頂部即時顯示繁體/簡體剩餘待分配本數，剩餘不為 0 時送出鈕 disabled
- [x] 4.4 後台 `/admin/materials`：多地址訂單展開列出各批次與各自「確認已寄送」鈕，顯示「部分已寄送（x/N）」
- [x] 4.5 出貨單列印頁 `/admin/materials/[id]/print`：多地址訂單迴圈渲染 N 份（各批次數量），以 CSS page-break 分頁

## 5. 驗證

- [x] 5.1 （需 dev 環境登入手動實測）單一地址流程完全不變（申請、確認寄送、收件）
- [x] 5.2 （需 dev 環境登入手動實測）多地址：本數未分配完無法送出；分配剛好可送出並建立 N 筆批次
- [x] 5.3 （需 dev 環境登入手動實測）多地址逐批次確認，最後一批寄送後 `CourseOrder.shippedAt` 自動設定、講師可確認收件
- [x] 5.4 （需 dev 環境登入手動實測）出貨單列印多地址產生 N 份、數量取自各批次
- [x] 5.5 `npm run build` 通過（含型別檢查與 Next 內建 lint）
