## Why

`cr-spec-260331-002` 將超商門市資訊改用 `storeId` / `storeName` 結構化欄位儲存，但出貨單列印頁（`/admin/materials/[id]/print`）仍只讀取 `deliveryAddress`，導致 7-11 / 全家取貨訂單的出貨單顯示「（未填）」，管理者無法得知正確取貨門市。

## What Changes

- `getCourseOrderForPrint` 補選 `storeId`、`storeName` 欄位
- 出貨單列印頁「收件資訊」區塊：超商取貨時顯示「門市名稱」與「門市店號」兩列，郵寄時顯示「收件地址」

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `material-order-application`：出貨單列印頁正確顯示超商門市資訊（`storeName` / `storeId`）

## Impact

- **資料層**：`lib/data/course-order.ts` → `getCourseOrderForPrint` 補 select `storeId`、`storeName`
- **UI**：`app/(user)/admin/materials/[id]/print/page.tsx` 收件資訊區塊依 `deliveryMethod` 條件渲染
