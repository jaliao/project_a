# Proposal: cr-spec-260706-001 多地址切換回單一地址後無法送出（驗證修正）

## Why

使用者回報：教材申請表單先切到「多個地址」模式並新增地址列（未填完），再切回「單一地址」模式後，即使單一地址資訊已填妥，表單仍因隱藏的多地址欄位必填驗證卡住而無法送出，且錯誤訊息位於已隱藏的 UI 中，使用者看不到任何提示。

## What Changes

- 修正 `materialOrderSchema`（`lib/schemas/course-order.ts`）：`shipments` 陣列的逐項驗證（收件人、電話、門市/地址、書本指派）僅在 `shipMode === 'multiple'` 時生效；`single` 模式下完全忽略 `shipments` 殘留內容。
  - 根因：`shipments: z.array(shipmentItemSchema).optional()` 屬基底 object 驗證，不受 `superRefine` 的 shipMode 分流控制——只要陣列存在就會逐項驗證。
- 表單元件（`components/course-session/material-order-dialog.tsx`）配合調整：切回 `single` 時保留使用者已填的多地址列資料（再切回 multiple 不遺失），但不阻擋送出。
- Server Action（`app/actions/course-order.ts`）確認 `single` 模式送單時忽略 payload 中殘留的 `shipments`，不寫入。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `material-multi-address-shipping`: 驗證需求變更——多地址欄位（`shipments[]` 逐項必填）僅於多地址模式驗證；單一地址模式下殘留的多地址列不得阻擋送出，且送單時不得被採用。

## Impact

- `lib/schemas/course-order.ts` — `materialOrderSchema` 驗證邏輯（客戶端與 Server Action 共用）
- `components/course-session/material-order-dialog.tsx` — shipMode 切換行為
- `app/actions/course-order.ts` — single 模式送單時對殘留 `shipments` 的處理
- 無資料庫 schema 異動、無 API 介面異動、非破壞性變更
