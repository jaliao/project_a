## Why

目前一張教材訂購（`CourseOrder`）只能指定**單一**寄件地址，但實務上一個課程的學員可能分散各地，需要把同一批教材拆成多個地址分別寄送。現行模型無法表達「一張訂單、多個收件地址、各自進度」，導致講師必須拆成多筆申請或私下協調。

## What Changes

- 教材申請時，講師 SHALL 可選擇「寄送單一地址」（現行流程，**不變**）或「寄送多個地址」。
- 選擇多個地址時，講師 SHALL 為每個地址設定寄件方式（沿用超商門市選擇器／宅配地址）與**依教材版本（繁體／簡體）的本數**，並 SHALL 持續新增地址直到所有書籍（繁體與簡體本數）都被分配完畢。
- 管理者寄送端 SHALL 改為可逐個地址標記寄送；當**所有地址皆已寄送**時，系統 SHALL 自動將 `CourseOrder.shippedAt` 設為最後一批寄送時間，使講師既有「我已收到教材」收件流程維持不變。
- 出貨單列印 SHALL 支援多地址（每個寄送地址各自一份出貨單）。
- 單一地址情境的資料結構與流程**完全不動**（無 shipment 子紀錄、`confirmShipment` 行為不變）。

## Capabilities

### New Capabilities
- `material-multi-address-shipping`: 多地址教材寄送能力——新增寄送批次資料模型（每筆含寄件方式／門市或地址／繁體本數／簡體本數／寄送時間）、申請時的單一/多地址選擇、依版本分配書本直到全部分配完畢的驗證，以及全部寄完自動設 `shippedAt` 的完成判定。

### Modified Capabilities
- `course-order`: `applyMaterialOrder` Server Action 新增「多地址寄送批次」輸入與驗證（多地址時各版本本數總和 SHALL 等於應寄本數）；單一地址行為不變。
- `admin-material-management`: 「確認已寄送」由整張單一次確認，擴充為多地址時逐批次確認；全部寄完自動設 `CourseOrder.shippedAt`。
- `print-shipping-order`: 出貨單列印支援多地址（每個寄送批次各自一份，數量取自該批次而非整張單）。

## Impact

- **資料模型**：`prisma/schema/course-order.prisma` 新增寄送批次模型（關聯 `CourseOrder`，含 `deliveryMethod`/`deliveryAddress`/`storeId`/`storeName`/繁體本數/簡體本數/`shippedAt`）；`CourseOrder` 新增寄送模式判別（單一／多地址）；需 migration。
- **Server Actions**：`app/actions/course-order.ts`（`applyMaterialOrder`、`confirmShipment` 及完成判定邏輯）。
- **Schema 驗證**：`lib/schemas/course-order.ts` 新增寄送批次陣列與「各版本本數總和需等於應寄本數」驗證。
- **UI**：教材申請表單（多地址新增/刪除、門市選擇器、版本本數輸入、剩餘本數提示）；後台 `/admin/materials` 寄送確認改為可逐批次；出貨單列印頁 `/admin/materials/[id]/print` 支援多份。
- **不影響**：單一地址流程、講師收件確認（`confirmReceipt`）行為維持不變。
