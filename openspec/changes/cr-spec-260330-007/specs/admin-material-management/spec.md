## MODIFIED Requirements

### Requirement: 管理者確認已寄送
管理頁 SHALL 在狀態為「待寄送」的申請列顯示「確認已寄送」按鈕，點擊後呼叫 `confirmShipment(orderId)` Server Action。

#### Scenario: 點擊確認已寄送成功
- **WHEN** 管理者點擊「確認已寄送」
- **THEN** `CourseOrder.shippedAt` 設為當前時間，列表刷新，狀態更新為「已寄送」，顯示「已標記為已寄送」toast

#### Scenario: 已寄送的申請不顯示確認按鈕
- **WHEN** `CourseOrder.shippedAt != null`
- **THEN** 不顯示「確認已寄送」按鈕

#### Scenario: 非管理者無法呼叫 confirmShipment
- **WHEN** role 非 admin/superadmin 的使用者呼叫 `confirmShipment`
- **THEN** 回傳 `{ success: false, message: '無權限' }`

## ADDED Requirements

### Requirement: 後台管理頁列印出貨單按鈕
管理頁每筆申請 SHALL 提供「列印出貨單」按鈕，點擊後開啟出貨單列印頁。

#### Scenario: 點擊列印出貨單
- **WHEN** 管理者點擊「列印出貨單」按鈕
- **THEN** 以新分頁導覽至 `/admin/materials/[id]/print`

#### Scenario: 所有申請均顯示列印按鈕
- **WHEN** 管理者檢視教材申請列表
- **THEN** 每筆申請（無論狀態）均顯示「列印出貨單」按鈕
