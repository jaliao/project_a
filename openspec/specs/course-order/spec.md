# course-order Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for course-order.

## Requirements

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

### Requirement: CourseOrder 收件人與連絡電話欄位
`CourseOrder` model SHALL 新增 `recipientName String?` 與 `recipientPhone String?` 欄位，記錄單一地址模式的收件人姓名與連絡電話。

#### Scenario: 單一地址預設帶入申請講師
- **WHEN** `shipMode == single` 送出申請且未提供 `recipientName`／`recipientPhone`
- **THEN** `recipientName` 預設為申請講師姓名（`User.realName`，fallback `User.name`），`recipientPhone` 預設為申請講師 `User.phone`

#### Scenario: 單一地址可自訂收件人
- **WHEN** `shipMode == single` 送出申請且提供非空 `recipientName`／`recipientPhone`
- **THEN** `CourseOrder.recipientName`／`recipientPhone` 儲存講師輸入的值

### Requirement: MaterialShipment 收件人與連絡電話欄位
`MaterialShipment` model SHALL 新增 `recipientName String?` 與 `recipientPhone String?` 欄位，記錄該寄送批次（地址）的收件人姓名與連絡電話。

#### Scenario: 多地址批次儲存收件人
- **WHEN** `shipMode == multiple` 送出申請，每筆寄送批次含收件人與連絡電話
- **THEN** 各 `MaterialShipment` 儲存對應的 `recipientName` 與 `recipientPhone`

### Requirement: applyMaterialOrder Server Action
系統 SHALL 提供 `applyMaterialOrder(inviteId, data)` Server Action，讓講師建立或更新 CourseOrder 並關聯至 CourseInvite。

Server Action 輸入資料新增 `storeId String?` 與 `storeName String?` 欄位；當 `deliveryMethod == sevenEleven` 時，server-side Zod schema SHALL 驗證 `storeId` 與 `storeName` 皆不為空。

Server Action 輸入資料 SHALL 新增收件人 `recipientName` 與連絡電話 `recipientPhone`：

- `single`：單一地址收件人欄位；未提供時 server-side SHALL 以申請講師姓名（`User.realName`／`User.name`）與 `User.phone` 回填，確保儲存值非空。
- `multiple`：寄送批次陣列每筆 SHALL 含 `recipientName` 與 `recipientPhone`，server-side Zod schema SHALL 驗證每筆皆不為空，否則拒絕。

Server Action 輸入資料 SHALL 新增寄送模式 `shipMode`（`single` | `multiple`）：

- `single`：沿用現行單一地址行為（CourseOrder 自身的寄件方式/地址欄位），不建立寄送批次。
- `multiple`：輸入 SHALL 含寄送批次陣列，每筆含寄件方式、地址或門市資料、繁體本數、簡體本數；server-side schema SHALL 驗證各批次繁體本數總和等於應寄繁體本數、簡體本數總和等於應寄簡體本數，否則拒絕。

#### Scenario: 首次建立 CourseOrder
- **WHEN** `CourseInvite.courseOrderId == null`，講師送出完整表單資料
- **THEN** 新建 CourseOrder，更新 `CourseInvite.courseOrderId`，回傳 `{ success: true, data: { orderId } }`

#### Scenario: 更新現有 CourseOrder
- **WHEN** `CourseInvite.courseOrderId != null` 且 `shippedAt == null`
- **THEN** 更新 CourseOrder 欄位（包含 `storeId`、`storeName`、`recipientName`、`recipientPhone`），回傳 `{ success: true }`

#### Scenario: 選擇 7-11 但未提供門市資料
- **WHEN** `deliveryMethod == sevenEleven` 且 `storeId` 或 `storeName` 為空
- **THEN** 回傳 `{ success: false, errors: { storeId: ['請選取取貨門市'] } }`

#### Scenario: 多地址送出且建立寄送批次
- **WHEN** `shipMode == multiple` 且各版本本數總和等於應寄本數、每筆批次含非空收件人與連絡電話
- **THEN** 建立/更新 CourseOrder 並建立對應寄送批次（含 `recipientName`／`recipientPhone`），回傳 `{ success: true }`

#### Scenario: 多地址批次缺收件人或連絡電話
- **WHEN** `shipMode == multiple` 且任一批次 `recipientName` 或 `recipientPhone` 為空
- **THEN** 回傳 `{ success: false }` 並提示該批次需填寫收件人與連絡電話，不建立寄送批次

#### Scenario: 多地址本數分配不符
- **WHEN** `shipMode == multiple` 且繁體或簡體本數總和不等於應寄本數
- **THEN** 回傳 `{ success: false, message: '尚未分配完所有書籍' }`，不建立寄送批次

#### Scenario: 已寄送後禁止修改
- **WHEN** `CourseOrder.shippedAt != null`
- **THEN** 回傳 `{ success: false, message: '教材已寄出，無法修改申請' }`

#### Scenario: 非課程講師不可申請
- **WHEN** 非 CourseInvite.createdById 的使用者呼叫
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 單一地址收件地址欄位郵遞區號提示
教材申請表單單一地址模式（`shipMode == single`）的收件地址欄位下方，SHALL 顯示提示文字，告知使用者需填寫完整地址並包含郵遞區號，文案走 i18n key（`course.material.deliveryAddressHint`），不寫死中文。

#### Scenario: 單一地址模式顯示郵遞區號提示
- **WHEN** 講師於教材申請表單選擇單一地址寄送方式且取貨方式非超商
- **THEN** 收件地址欄位下方顯示提示文字，提醒需包含郵遞區號
