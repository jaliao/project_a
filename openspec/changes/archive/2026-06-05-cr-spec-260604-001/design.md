## Context

現行教材寄送：`CourseOrder` 一張對一個 `CourseInvite`，寄件資訊（`deliveryMethod`/`deliveryAddress`/`storeId`/`storeName`）存在訂單本身，管理者以 `confirmShipment(orderId)` 一次把整張單設 `shippedAt`，講師再以 `confirmReceipt` 確認收件。應寄書本數量由 approved 學員的 `materialChoice` 統計而來（繁體 = `traditional` 人數、簡體 = `simplified` 人數；統計邏輯見 `lib/data/course-sessions.ts:452`）。

本變更要讓講師在申請時選擇把同一批教材拆送多個地址，並逐地址寄送直到全部書籍寄完。已於 proposal 階段確認：講師於申請時設定、依教材版本（繁/簡）分別追蹤、每個地址沿用寄件方式 + 門市/宅配、全部寄完自動設 `CourseOrder.shippedAt`。

## Goals / Non-Goals

**Goals:**
- 新增寄送批次資料模型，支援一張 `CourseOrder` 對多個寄送地址。
- 申請表單支援「單一/多地址」切換；多地址時依繁/簡本數分配，分配完才能送出。
- 管理者逐批次確認寄送；全部寄完自動設 `CourseOrder.shippedAt`。
- 出貨單列印支援多份（每批次一份）。

**Non-Goals:**
- 不改動單一地址的資料結構與流程（無批次紀錄、`confirmShipment` 行為不變）。
- 不改動講師收件確認（`confirmReceipt`）。
- 不處理教材版本以外的拆分維度；不納入種子教師自用本數（應寄本數僅取學員統計，與現行出貨單一致）。
- 不做跨訂單合併寄送。

## Decisions

### 1. 新模型 `MaterialShipment`（寄送批次）
於 `prisma/schema/course-order.prisma` 新增：
- `id Int @id @default(autoincrement())`
- `courseOrderId Int` + relation 至 `CourseOrder`（`onDelete: Cascade`）
- `deliveryMethod DeliveryMethod`、`deliveryAddress String?`、`storeId String?`、`storeName String?`（沿用既有 enum/欄位語意）
- `traditionalQty Int @default(0)`、`simplifiedQty Int @default(0)`
- `shippedAt DateTime?`、`createdAt DateTime @default(now())`
- `CourseOrder` 端新增 `shipments MaterialShipment[]`

替代方案：把多地址塞進 `CourseOrder` 的 JSON 欄位。不採用——失去關聯查詢、逐批次 `shippedAt` 與 migration 型別安全。

### 2. 寄送模式判別：`CourseOrder.shipMode` 列舉
新增 `enum ShipMode { single multiple }`，`CourseOrder.shipMode ShipMode @default(single)`。
- `single`：使用 `CourseOrder` 自身寄件欄位，無 `shipments`。
- `multiple`：忽略 `CourseOrder` 自身寄件欄位，改讀 `shipments`。

替代方案：以 `shipments.length > 0` 隱式判別。採用顯式 enum 以利查詢/UI 分支清楚，且 migration 對既有資料預設 `single` 安全。

### 3. 應寄本數來源與驗證落點
- 應寄繁體/簡體本數一律由 server 端依 approved 學員 `materialChoice` 統計（沿用 `lib/data/course-sessions.ts` 既有邏輯，抽成可重用 helper）。
- 結構驗證（每筆批次欄位、超商門市必填）放 `lib/schemas/course-order.ts` 的 Zod schema。
- **本數總和等於應寄本數**屬跨欄位且依賴 DB 的權威驗證，放在 `applyMaterialOrder` action 內最終把關（不信任前端傳入的應寄總數）。

### 4. Server Actions
- `applyMaterialOrder`：輸入新增 `shipMode` 與 `shipments[]`。`multiple` 時於 `$transaction` 內：刪除該訂單既有未寄送批次 → 重新建立 → 驗證本數總和。`single` 路徑維持原行為。
- 寄送確認：
  - 單一地址沿用 `confirmShipment(orderId)`（不變）。
  - 多地址新增 `confirmShipmentBatch(shipmentId)`：設該批次 `shippedAt`；若該訂單所有批次皆已寄送，於同一 `$transaction` 設 `CourseOrder.shippedAt = 該批次時間`。
- 編輯鎖定：多地址訂單一旦有任一批次已寄送，`applyMaterialOrder` 即拒絕修改（延伸既有「已寄送禁止修改」語意至批次層級）。

### 5. UI
- 教材申請表單新增「寄送方式」單選（單一地址／多個地址）。
- 多地址：動態清單，每列含 `EcpayStoreSelector`（超商）或宅配地址 + 繁體/簡體數量輸入；頂部即時顯示「繁體/簡體尚待分配」剩餘本數；剩餘不為 0 時送出鈕 disabled。
- 後台 `/admin/materials`：多地址訂單展開列出各批次與各自「確認已寄送」鈕。
- 出貨單列印頁：多地址訂單迴圈渲染 N 份（各批次數量），以 CSS `page-break` 分頁。

## Risks / Trade-offs

- [多地址申請後學員 materialChoice 異動，導致應寄本數與既有批次分配不符] → 編輯時重新統計並要求重新分配；已開始寄送則鎖定，提示管理者/講師人工協調。
- [single→multiple 切換時殘留 `CourseOrder` 自身寄件欄位] → `multiple` 時 UI/列印一律以 `shipments` 為準，忽略訂單自身欄位（不清空以利切回）。
- [部分批次已寄、其餘未寄的中間狀態] → 訂單狀態以「是否所有批次皆寄送」判定；UI 顯示「部分已寄送（x/N）」。
- [`confirmReceipt` 依賴 `CourseOrder.shippedAt`] → 全部寄完才自動設 `shippedAt`，故收件流程行為不變，無需改動。

## Migration Plan

- 新增 `ShipMode` enum、`CourseOrder.shipMode`（預設 `single`）、`MaterialShipment` 表；皆為附加式，既有資料自動為 `single` 且無批次，不影響現行單一地址流程。
- 以 `make schema-update name=add_material_shipment` 產生 migration。
- 回滾：移除新表/欄位與相關 action/UI 分支即可；單一地址路徑不受影響。

## Open Questions

- 種子教師自用本數是否需納入應寄本數？目前假設「否」（與現行出貨單統計一致），如需納入再調整 helper。
