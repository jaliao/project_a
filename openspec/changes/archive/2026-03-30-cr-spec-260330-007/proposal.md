## Why

教材申請流程存在資料重複填寫問題：書本數量目前由講師在 CourseOrder 表單手動填寫，但學員報名時已選擇書籍版本（`InviteEnrollment.materialChoice`），應直接統計學員資料，不再由講師重複填寫。同時，後台缺乏可列印的出貨單功能，管理者目前無法快速取得寄件所需資訊。

## What Changes

- **新增出貨單列印**：後台教材管理頁新增「列印出貨單」功能，出貨單內容包含：編號、收件者、寄件方式、地址（新欄位）、書本內容與數量
- **書本數量改為自動統計**：從該課程已核准學員（`EnrollmentStatus.approved`）的 `materialChoice` 統計繁體/簡體數量，不再由講師填寫
- **移除講師填寫書籍欄位**：CourseOrder 表單移除 `materialVersion`、`purchaseType`、`studentNames`、`quantity`、`quantityNote` 欄位
- **新增收件地址欄位**：`CourseOrder` 新增 `deliveryAddress` 欄位，供郵寄/宅配時填寫；便利商店取貨時填寫門市店號/店名

## Capabilities

### New Capabilities
- `print-shipping-order`：後台出貨單列印功能（瀏覽器列印或預覽頁面）

### Modified Capabilities
- `material-order-application`：移除書籍相關欄位（materialVersion、purchaseType、studentNames、quantity、quantityNote），新增 `deliveryAddress` 欄位；書本數量改為從學員 materialChoice 自動統計顯示
- `admin-material-management`：列表新增出貨單欄位資料（地址、書本統計數量）；新增「列印出貨單」操作

## Impact

- `prisma/schema/course-order.prisma`：新增 `deliveryAddress String`；可標記 `materialVersion`、`purchaseType`、`studentNames`、`quantity`、`quantityNote` 為廢棄欄位（先保留，待確認後 migration 刪除）
- `app/actions/course-order.ts`（或相關 action）：`applyMaterialOrder` 移除書籍相關欄位的存取
- `components/`：教材申請 Dialog 移除書籍欄位，新增地址欄位
- `app/(user)/admin/materials/`：新增出貨單列印頁面或列印觸發按鈕
- `lib/data/`：新增統計學員 materialChoice 的 data layer 函數
