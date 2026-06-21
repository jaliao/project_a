## MODIFIED Requirements

### Requirement: applyMaterialOrder Server Action
系統 SHALL 提供 `applyMaterialOrder(inviteId, data)` Server Action，讓講師建立或更新 CourseOrder 並關聯至 CourseInvite。

Server Action 輸入資料新增 `storeId String?` 與 `storeName String?` 欄位；當 `deliveryMethod == sevenEleven` 時，server-side Zod schema SHALL 驗證 `storeId` 與 `storeName` 皆不為空。

Server Action 輸入資料 SHALL 新增收件人 `recipientName` 與連絡電話 `recipientPhone`：

- `single`：單一地址收件人欄位；未提供時 server-side SHALL 以申請講師姓名（`User.realName`／`User.name`）與 `User.phone` 回填，確保儲存值非空。
- `multiple`：寄送批次陣列每筆 SHALL 含 `recipientName` 與 `recipientPhone`，server-side Zod schema SHALL 驗證每筆皆不為空，否則拒絕。

Server Action 輸入資料 SHALL 新增寄送模式 `shipMode`（`single` | `multiple`）：

- `single`：沿用現行單一地址行為（CourseOrder 自身的寄件方式/地址欄位），不建立寄送批次。
- `multiple`：輸入 SHALL 含寄送批次陣列，每筆含寄件方式、地址或門市資料、繁體本數、簡體本數；server-side schema SHALL 驗證各批次繁體本數總和等於應寄繁體本數、簡體本數總和等於應寄簡體本數，否則拒絕。

訂單一旦批價（`CourseOrder.quotedAt != null`），`applyMaterialOrder` SHALL 拒絕任何修改（鎖定申請），以避免金額與申請內容不一致。

#### Scenario: 首次建立 CourseOrder
- **WHEN** `CourseInvite.courseOrderId == null`，講師送出完整表單資料
- **THEN** 新建 CourseOrder，更新 `CourseInvite.courseOrderId`，回傳 `{ success: true, data: { orderId } }`

#### Scenario: 更新現有 CourseOrder
- **WHEN** `CourseInvite.courseOrderId != null` 且 `shippedAt == null` 且 `quotedAt == null`
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

#### Scenario: 已批價後禁止修改
- **WHEN** `CourseOrder.quotedAt != null`
- **THEN** 回傳 `{ success: false, message: '已批價，無法修改申請' }`，不變更資料

#### Scenario: 已寄送後禁止修改
- **WHEN** `CourseOrder.shippedAt != null`
- **THEN** 回傳 `{ success: false, message: '教材已寄出，無法修改申請' }`

#### Scenario: 非課程講師不可申請
- **WHEN** 非 CourseInvite.createdById 的使用者呼叫
- **THEN** 回傳 `{ success: false, message: '無權限' }`
