## ADDED Requirements

### Requirement: 管理者批價與確認收款操作
管理頁 SHALL 依訂單付款狀態提供操作：狀態「待批價」顯示「批價」按鈕（開啟金額＋匯款帳號對話框，帳號預設帶入系統設定值），呼叫 `quoteMaterialOrder`；狀態「待確認收款」顯示老師回填的匯款後五碼與「確認收款」按鈕，呼叫 `confirmMaterialPayment`。管理頁狀態標籤 SHALL 涵蓋待批價／待付款／待確認收款／待寄送／已寄送／已收件。

#### Scenario: 待批價顯示批價按鈕
- **WHEN** 管理者檢視狀態為「待批價」的申請
- **THEN** 顯示「批價」按鈕，點擊開啟含金額與匯款帳號（預設帶入 `remittance_account` 設定值）的對話框

#### Scenario: 待確認收款顯示後五碼與確認鈕
- **WHEN** 管理者檢視狀態為「待確認收款」的申請
- **THEN** 顯示老師回填的匯款後五碼與「確認收款」按鈕

#### Scenario: 狀態標籤涵蓋付款階段
- **WHEN** 管理者檢視教材申請列表
- **THEN** 每筆申請依推導顯示對應狀態標籤（待批價／待付款／待確認收款／待寄送／已寄送／已收件）

## MODIFIED Requirements

### Requirement: 管理者確認已寄送
管理頁 SHALL 在狀態為「待寄送」的申請列顯示「確認已寄送」按鈕，點擊後呼叫 `confirmShipment(orderId)` Server Action。「確認已寄送」SHALL 僅在訂單已確認收款（`paymentConfirmedAt != null`）後可用；未確認收款的訂單 SHALL NOT 顯示或允許寄送確認。

對於多地址寄送的訂單，管理頁 SHALL 改為列出各寄送批次，並於每個未寄送批次顯示「確認已寄送」按鈕；確認時僅標記該批次 `shippedAt`。當該訂單所有批次皆已寄送時，系統 SHALL 自動將 `CourseOrder.shippedAt` 設為最後一批次寄送時間，狀態更新為「已寄送」。單一地址訂單行為維持不變（整張一次確認）。

#### Scenario: 點擊確認已寄送成功（單一地址）
- **WHEN** 管理者對已確認收款的單一地址訂單點擊「確認已寄送」
- **THEN** `CourseOrder.shippedAt` 設為當前時間，列表刷新，狀態更新為「已寄送」，顯示「已標記為已寄送」toast

#### Scenario: 逐批次確認（多地址）
- **WHEN** 管理者對已確認收款的多地址訂單的某未寄送批次點擊「確認已寄送」
- **THEN** 僅該批次 `shippedAt` 設為當前時間；若仍有批次未寄送，`CourseOrder.shippedAt` 維持 null

#### Scenario: 多地址全部寄完
- **WHEN** 管理者標記多地址訂單的最後一個未寄送批次
- **THEN** 系統自動將 `CourseOrder.shippedAt` 設為該批次時間，狀態更新為「已寄送」

#### Scenario: 未確認收款不可寄送
- **WHEN** 訂單 `paymentConfirmedAt == null`（尚未確認收款）
- **THEN** 不顯示「確認已寄送」按鈕；若直接呼叫 `confirmShipment`／`confirmShipmentBatch` 則回傳 `{ success: false, message: '尚未確認收款' }`

#### Scenario: 已寄送的申請不顯示確認按鈕
- **WHEN** `CourseOrder.shippedAt != null`（或對應批次已寄送）
- **THEN** 不顯示該層級的「確認已寄送」按鈕

#### Scenario: 非管理者無法呼叫 confirmShipment
- **WHEN** role 非 admin/superadmin 的使用者呼叫 `confirmShipment`
- **THEN** 回傳 `{ success: false, message: '無權限' }`
