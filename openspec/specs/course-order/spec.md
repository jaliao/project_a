## ADDED Requirements

### Requirement: CourseOrder shippedAt 欄位
`CourseOrder` model SHALL 新增 `shippedAt DateTime?` 欄位，有值代表管理者已確認寄送。

#### Scenario: 預設值為 null
- **WHEN** 建立新的 CourseOrder
- **THEN** `shippedAt` 預設為 null（待寄送狀態）

### Requirement: CourseOrder receivedAt 欄位
`CourseOrder` model SHALL 新增 `receivedAt DateTime?` 欄位，有值代表講師已確認收件。

#### Scenario: 預設值為 null
- **WHEN** 建立新的 CourseOrder
- **THEN** `receivedAt` 預設為 null

#### Scenario: receivedAt 只能在 shippedAt 存在後設定
- **WHEN** `confirmReceipt` Action 被呼叫但 `shippedAt == null`
- **THEN** 回傳 `{ success: false, message: '教材尚未寄出' }`

### Requirement: confirmShipment Server Action
系統 SHALL 提供 `confirmShipment(orderId)` Server Action，僅管理者可呼叫，設定 `shippedAt`。

#### Scenario: 成功標記已寄送
- **WHEN** 管理者呼叫 `confirmShipment`，`shippedAt == null`
- **THEN** `shippedAt` 設為當前時間，回傳 `{ success: true }`

#### Scenario: 重複標記已寄送
- **WHEN** `shippedAt` 已有值
- **THEN** 回傳 `{ success: false, message: '已標記為寄送中' }`

### Requirement: confirmReceipt Server Action
系統 SHALL 提供 `confirmReceipt(inviteId)` Server Action，由講師呼叫，設定關聯 CourseOrder 的 `receivedAt`。

#### Scenario: 成功確認收件
- **WHEN** 講師呼叫 `confirmReceipt`，`shippedAt != null` 且 `receivedAt == null`
- **THEN** `receivedAt` 設為當前時間，回傳 `{ success: true }`

#### Scenario: 非課程講師不可操作
- **WHEN** 非 CourseInvite.createdById 的使用者呼叫
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: applyMaterialOrder Server Action
系統 SHALL 提供 `applyMaterialOrder(inviteId, data)` Server Action，讓講師建立或更新 CourseOrder 並關聯至 CourseInvite。

#### Scenario: 首次建立 CourseOrder
- **WHEN** `CourseInvite.courseOrderId == null`，講師送出完整表單資料
- **THEN** 新建 CourseOrder，更新 `CourseInvite.courseOrderId`，回傳 `{ success: true, data: { orderId } }`

#### Scenario: 更新現有 CourseOrder
- **WHEN** `CourseInvite.courseOrderId != null` 且 `shippedAt == null`
- **THEN** 更新 CourseOrder 欄位，回傳 `{ success: true }`

#### Scenario: 已寄送後禁止修改
- **WHEN** `CourseOrder.shippedAt != null`
- **THEN** 回傳 `{ success: false, message: '教材已寄出，無法修改申請' }`

#### Scenario: 非課程講師不可申請
- **WHEN** 非 CourseInvite.createdById 的使用者呼叫
- **THEN** 回傳 `{ success: false, message: '無權限' }`
