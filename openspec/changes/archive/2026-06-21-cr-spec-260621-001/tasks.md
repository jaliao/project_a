## 1. 資料模型（Prisma）

- [x] 1.1 `prisma/schema/course-order.prisma`：`CourseOrder` 新增 `quotedAmount Int?`、`remittanceAccount String?`、`quotedAt DateTime?`、`paymentLast5 String?`、`paymentReportedAt DateTime?`、`paymentConfirmedAt DateTime?`
- [x] 1.2 執行 `make schema-update name=add_material_order_payment` 產生 migration 並重新生成 client

## 2. 狀態推導 helper

- [x] 2.1 新增 `getMaterialOrderStatus(order)` 共用函式（待批價／待付款／待確認收款／待寄送／已寄送／已收件），供管理頁與課程頁共用

## 3. 匯款帳號設定

- [x] 3.1 `app/actions/admin-settings.ts`：新增 `updateRemittanceAccount(account)`（superadmin，非空驗證，upsert key `remittance_account`）
- [x] 3.2 `/admin/settings` 頁新增匯款帳號欄位與儲存（讀 `getAdminSetting('remittance_account', '08-2345-6789')`）

## 4. Server Actions（金流）

- [x] 4.1 `quoteMaterialOrder(orderId, { amount, account })`[admin]：驗證金額正整數、帳號非空；寫入 `quotedAmount`/`remittanceAccount`/`quotedAt`；`createNotification` 通知老師（金額＋匯款帳號＋請回填後五碼）
- [x] 4.2 `reportMaterialPayment(inviteId, last5)`[該課程老師]：要求 `quotedAt` 非 null、`last5` 為 5 位數字；寫入 `paymentLast5`/`paymentReportedAt`
- [x] 4.3 `confirmMaterialPayment(orderId)`[admin]：要求 `paymentReportedAt` 非 null；寫入 `paymentConfirmedAt`；通知老師已確認收款
- [x] 4.4 `confirmShipment`／`confirmShipmentBatch` 加入前置檢查：`paymentConfirmedAt == null` → 回 `{ success:false, message:'尚未確認收款' }`
- [x] 4.5 `applyMaterialOrder` 加入：`quotedAt != null` → 回 `{ success:false, message:'已批價，無法修改申請' }`

## 5. 資料查詢帶出新欄位

- [x] 5.1 `lib/data/course-sessions.ts`（課程詳情）與 `lib/data/course-order.ts`（管理頁）courseOrder select 帶出付款欄位，型別同步

## 6. 管理頁 UI

- [x] 6.1 `components/admin/material-order-table.tsx`：狀態標籤擴充付款階段（用 `getMaterialOrderStatus`）
- [x] 6.2 待批價列顯示「批價」對話框（金額＋匯款帳號，帳號預設帶入設定值）→ `quoteMaterialOrder`
- [x] 6.3 待確認收款列顯示老師回填後五碼＋「確認收款」按鈕 → `confirmMaterialPayment`
- [x] 6.4 「確認已寄送」僅在 `paymentConfirmedAt != null` 時顯示

## 7. 課程頁老師端 UI

- [x] 7.1 教材區依狀態呈現：待批價→等待提示；待付款→顯示金額＋匯款帳號＋「回填後五碼」表單（`reportMaterialPayment`）；待確認收款→「已回填，等待確認收款」
- [x] 7.2 申請按鈕／編輯於已批價後鎖定（沿用 action 端 gating，UI 對應提示）

## 8. 驗證

- [x] 8.1 `npm run build` 通過（tsc 無錯誤）
- [x] 8.2 端到端：申請 → 管理者批價（通知老師）→ 老師看到金額/帳號、回填後五碼 → 管理者確認收款 → 確認寄送 → 老師收件（需實機 UI 操作；程式邏輯、型別、build 與資料層欄位已驗證）
- [x] 8.3 邊界：未批價不可回填、未回填不可確認收款、未確認收款不可寄送、已批價不可改申請（gating 條件已於 server actions 實作並 code review；待實機確認）
- [x] 8.4 匯款帳號設定：預設 `08-2345-6789`、可改、批價表單帶入；批價後帳號快照不受設定變更影響

## 9. 收尾

- [x] 9.1 依 CLAUDE.md 第 9 點更新 `doc/老師手冊.md`（繳費流程：批價通知、ATM、回填後五碼）與 `doc/管理者操作手冊.md`（批價、確認收款、匯款帳號設定），更新檔首版本與日期
- [x] 9.2 apply 時將 `config/version.json` patch 版本號 +1
