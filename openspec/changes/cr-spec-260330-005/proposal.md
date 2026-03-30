## Why

授課流程在「開始上課」前缺乏正式的教材申請與寄送追蹤機制。講師需要主動填寫購買資訊，管理者確認寄送後，講師收件才能開課，目前系統無此流程，教材進度無從管理。

## What Changes

- 課程詳情頁（前台）新增「申請教材」按鈕，僅講師可見
- 點擊後開啟教材申請表單，欄位預先帶入 CourseOrder / 講師 Profile 已有資料
- 後台管理者新增「教材申請管理」頁或區塊，可看到所有申請列表與狀態
- 管理者點選「確認已寄送」標記教材已出貨
- 講師在前台課程詳情頁點選「我已收到教材」確認收件
- 收件確認後，「開始上課」按鈕解鎖（原本無此前置條件）
- `CourseOrder` model 新增 `shippedAt`（管理者寄送時間）與 `receivedAt`（講師收件時間）欄位

## Capabilities

### New Capabilities
- `material-order-application`: 前台申請教材流程——課程詳情頁的「申請教材」按鈕與表單（預填授課資料）、講師「確認收件」操作
- `admin-material-management`: 後台教材申請管理——管理者查看所有申請列表與狀態、點選「確認已寄送」

### Modified Capabilities
- `course-order`: CourseOrder model 新增 `shippedAt DateTime?` 與 `receivedAt DateTime?` 欄位，追蹤寄送與收件狀態
- `course-status`: 「開始上課」按鈕新增前置條件——課程的 CourseOrder 必須存在且 `receivedAt != null`（講師已收件）

## Impact

- `prisma/schema/course-order.prisma`：新增 `shippedAt`、`receivedAt` 欄位
- `prisma/migrations/`：對應 migration
- `app/(user)/course/[id]/`：課程詳情頁新增申請教材按鈕、收件確認按鈕、開始上課前置條件
- `app/(admin)/`：新增教材申請管理頁或區塊（管理者後台）
- `app/actions/`：新增 applyMaterialOrder、confirmShipment、confirmReceipt Server Actions
- `lib/data/`：新增教材申請相關 data access functions
