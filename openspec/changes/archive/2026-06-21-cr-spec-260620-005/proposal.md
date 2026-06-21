## Why

教材申請（申請書本）目前在多地址模式下，每個寄送地址只記錄寄件方式與地址，**沒有收件人姓名與連絡電話**；單一地址模式也未提供獨立的收件人／連絡電話欄位。出貨時物流人員無法得知每個地址的實際收件人與聯絡方式，造成寄送困難。本變更為每個寄送地址補上「收件人」與「連絡電話」，並讓出貨單顯示這些資訊。

## What Changes

- **多地址模式**：每個寄送地址 SHALL 必填「收件人」與「連絡電話」，與寄件方式、地址、各版本本數一併送出與儲存。
- **單一地址模式**：新增「收件人」與「連絡電話」欄位；**預設帶入申請的講師**（姓名與電話），可由講師修改。
- **出貨單（列印頁）**：每份出貨單 SHALL 顯示該地址的「收件人」與「連絡電話」；多地址訂單的每份批次出貨單顯示各自的收件人／電話。
- **資料模型**：`MaterialShipment` 新增 `recipientName`、`recipientPhone`；`CourseOrder` 新增 `recipientName`、`recipientPhone`（單一地址用）。
- **Server Action**：`applyMaterialOrder` 輸入與 Zod schema 新增上述欄位並驗證（不可為空）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-order`: `CourseOrder` 與 `MaterialShipment` 資料模型新增 `recipientName`／`recipientPhone`；`applyMaterialOrder` Server Action 輸入與 Zod 驗證新增收件人／連絡電話（單一地址預設為申請講師、多地址每批次必填）。
- `material-multi-address-shipping`: 寄送批次資料模型與多地址申請表單新增每個地址的「收件人」「連絡電話」必填欄位。
- `print-shipping-order`: 出貨單列印頁新增「收件人」「連絡電話」欄位（單一地址取自訂單、多地址取自各批次）。

## Impact

- `prisma/schema/course-order.prisma`：`CourseOrder`、`MaterialShipment` 各加兩欄位 → 需 migration。
- `lib/schemas/`：教材申請 Zod schema（單一地址 + 寄送批次陣列）新增 recipientName／recipientPhone。
- `app/actions/`：`applyMaterialOrder` 建立／更新邏輯帶入新欄位、單一地址預設值。
- 教材申請表單 UI：單一地址區與多地址清單每列新增兩個輸入欄位。
- 出貨單列印頁（`/admin/materials/[id]/print`）：新增顯示列。
- `config/version.json` patch +1；依 CLAUDE.md 第 9 點檢查 `doc/` 老師手冊（申請流程）與管理者手冊（出貨單）。
