## ADDED Requirements

### Requirement: CourseOrder storeId 欄位
`CourseOrder` model SHALL 新增 `storeId String?` 欄位，儲存 7-11 取貨門市店號。

#### Scenario: 選擇 7-11 取貨時設定 storeId
- **WHEN** 建立或更新 `CourseOrder` 且 `deliveryMethod == sevenEleven`
- **THEN** `storeId` 儲存使用者透過門市選擇器選取的店號

#### Scenario: 非 7-11 取貨時 storeId 為 null
- **WHEN** `deliveryMethod` 為 `familyMart` 或 `delivery`
- **THEN** `storeId` 為 null

### Requirement: CourseOrder storeName 欄位
`CourseOrder` model SHALL 新增 `storeName String?` 欄位，儲存 7-11 取貨門市店名。

#### Scenario: 選擇 7-11 取貨時設定 storeName
- **WHEN** 建立或更新 `CourseOrder` 且 `deliveryMethod == sevenEleven`
- **THEN** `storeName` 儲存使用者透過門市選擇器選取的店名

#### Scenario: 非 7-11 取貨時 storeName 為 null
- **WHEN** `deliveryMethod` 為 `familyMart` 或 `delivery`
- **THEN** `storeName` 為 null

## MODIFIED Requirements

### Requirement: applyMaterialOrder Server Action
系統 SHALL 提供 `applyMaterialOrder(inviteId, data)` Server Action，讓講師建立或更新 CourseOrder 並關聯至 CourseInvite。

Server Action 輸入資料新增 `storeId String?` 與 `storeName String?` 欄位；當 `deliveryMethod == sevenEleven` 時，server-side Zod schema SHALL 驗證 `storeId` 與 `storeName` 皆不為空。

#### Scenario: 首次建立 CourseOrder
- **WHEN** `CourseInvite.courseOrderId == null`，講師送出完整表單資料
- **THEN** 新建 CourseOrder，更新 `CourseInvite.courseOrderId`，回傳 `{ success: true, data: { orderId } }`

#### Scenario: 更新現有 CourseOrder
- **WHEN** `CourseInvite.courseOrderId != null` 且 `shippedAt == null`
- **THEN** 更新 CourseOrder 欄位（包含 `storeId`、`storeName`），回傳 `{ success: true }`

#### Scenario: 選擇 7-11 但未提供門市資料
- **WHEN** `deliveryMethod == sevenEleven` 且 `storeId` 或 `storeName` 為空
- **THEN** 回傳 `{ success: false, errors: { storeId: ['請選取取貨門市'] } }`

#### Scenario: 已寄送後禁止修改
- **WHEN** `CourseOrder.shippedAt != null`
- **THEN** 回傳 `{ success: false, message: '教材已寄出，無法修改申請' }`

#### Scenario: 非課程講師不可申請
- **WHEN** 非 CourseInvite.createdById 的使用者呼叫
- **THEN** 回傳 `{ success: false, message: '無權限' }`
