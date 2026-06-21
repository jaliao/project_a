## Context

教材流程現況：`applyMaterialOrder`（老師申請）→ `confirmShipment`／`confirmShipmentBatch`（管理者寄送）→ `confirmReceipt`（老師收件）。`CourseOrder` 以 `shippedAt`／`receivedAt` 追蹤寄送；狀態於 `material-order-table.tsx` 內聯推導（received → shipped → 待寄送）。設定以 `AdminSetting`（key-value，`getAdminSetting`/`upsertAdminSetting`）儲存；通知以 `createNotification(userId, title, body)`。

本變更在「申請」與「寄送」之間插入金流：批價 → 付款 → 確認收款。

## Goals / Non-Goals

**Goals:**
- 整張訂單單一金額的批價→付款→確認收款狀態機，並 gating 寄送。
- 匯款帳號可於 `/admin/settings` 設定（預設 `08-2345-6789`），批價時帶入快照。
- 老師回填後五碼、管理者確認收款、各步驟通知。

**Non-Goals:**
- 不串接第三方金流（純人工 ATM + 後五碼核對；非 ECPay 線上付款）。
- 不做每地址各自金額（多地址仍整張一個金額）。
- 不自動驗證轉帳真實性（管理者人工核對後五碼）。

## Decisions

### 決策 1：以時間戳推導狀態（不另設 enum 欄位）
沿用既有以 nullable 時間戳推導狀態的慣例。`CourseOrder` 新增：
- `quotedAmount Int?`、`remittanceAccount String?`、`quotedAt DateTime?`（批價）
- `paymentLast5 String?`、`paymentReportedAt DateTime?`（老師回填）
- `paymentConfirmedAt DateTime?`（管理者確認收款）

訂單狀態（單一真相，供管理頁與課程頁共用，建議抽 `getMaterialOrderStatus(order)` helper）：
`!quotedAt` → 待批價；`!paymentReportedAt` → 待付款；`!paymentConfirmedAt` → 待確認收款；`!shippedAt` → 待寄送；`!receivedAt` → 已寄送；else 已收件。
- 替代方案：新增 `paymentStatus` enum 欄位 → 與既有時間戳慣例不一致且需同步維護，否決。

### 決策 2：批價快照匯款帳號
批價時將當下匯款帳號寫入 `CourseOrder.remittanceAccount`（快照），避免日後設定變更影響已批價訂單的應匯帳號。批價表單帳號欄預設帶入 `getAdminSetting('remittance_account', '08-2345-6789')`，管理者可改。

### 決策 3：三個新 Server Action + 既有寄送 gating
- `quoteMaterialOrder(orderId, { amount, account })`[admin]：驗證金額>0、帳號非空；寫入 quoted 欄位；`createNotification` 通知老師（含金額、匯款帳號、請回填後五碼）。
- `reportMaterialPayment(inviteId, last5)`[老師=createdById]：驗證 5 碼數字；寫入 `paymentLast5`、`paymentReportedAt`。僅該課程老師可呼叫。
- `confirmMaterialPayment(orderId)`[admin]：要求 `paymentReportedAt` 已存在；寫入 `paymentConfirmedAt`；通知老師款項已確認、將安排寄送。
- `confirmShipment`／`confirmShipmentBatch`[admin]：新增前置檢查 `paymentConfirmedAt != null`，否則回 `{ success:false, message:'尚未確認收款' }`。

### 決策 4：批價後鎖定申請
`applyMaterialOrder` 新增：若 `CourseOrder.quotedAt != null` → 回 `{ success:false, message:'已批價，無法修改申請' }`（與既有「已寄送禁止修改」並列）。

### 決策 5：UI 落點
- 管理頁 `material-order-table.tsx`：依狀態顯示對應操作 —— 待批價→「批價」對話框（金額＋帳號）；待確認收款→顯示老師回填後五碼＋「確認收款」；待寄送→既有「確認已寄送」。付款狀態標籤擴充。
- 課程頁老師端：待批價→「等待管理者批價」；待付款→顯示金額＋匯款帳號＋「回填後五碼」表單；待確認收款→「已回填，等待確認收款」；其後沿用既有寄送／收件。
- `/admin/settings`：新增匯款帳號欄位（superadmin 可改，比照 hierarchy_depth）。

### 決策 6：金額型別
`quotedAmount` 採整數（新台幣元，無小數）。

## Risks / Trade-offs

- [既有訂單無付款欄位（migration 前）] → 欄位 nullable；既有訂單 `quotedAt` 為 null → 落在「待批價」。視為待補批價，符合語意；如需可後續批次回填。
- [寄送 gating 影響既有單一/多地址流程] → 兩者皆於 confirmShipment(Batch) 入口統一檢查 `paymentConfirmedAt`，行為一致。
- [後五碼僅供人工核對，非真驗證] → 屬 Non-Goal；管理者「確認收款」為人工把關。
- [批價帳號快照與設定值不同步] → 刻意快照（決策 2），以已批價當下帳號為準。

## Migration Plan

`course-order.prisma` 新增 6 個 nullable 欄位 → `make schema-update` 產生 migration（無破壞性、無需回填）。`AdminSetting` 無 schema 變更（沿用 key-value）。部署即生效；回滾＝還原 schema 與程式。

## Open Questions

無。
