## Why

教材申請表單的「收件地址」欄位（`material-order-dialog.tsx`，單一地址與多地址模式皆有）目前沒有任何文字說明，使用者常漏填郵遞區號導致寄送延誤或退件。加上提示文字可降低漏填機率，且不需改變現有驗證邏輯（欄位仍保持彈性，僅為必填非空字串）。

## What Changes

- `material-order-dialog.tsx` 單一地址模式的「收件地址」欄位下方，新增提示文字「請填寫完整地址並包含郵遞區號」。
- 同一元件多地址模式（`MultiAddressRow`）的「收件地址」欄位下方，同樣新增此提示文字。
- 新增 i18n key `course.material.deliveryAddressHint`（`messages/zh-TW.json` 為來源，補 `en.json`，`zh-CN.json` 重新產生），沿用該命名空間既有的 `*Hint` 命名慣例（如 `unassignedHint`、`startGateHint`）。
- 僅文字提示，不新增格式驗證，欄位仍維持現行「必填非空字串」規則（`lib/schemas/course-order.ts` 不變）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-order`：單一地址收件地址欄位新增郵遞區號提示文字需求
- `material-multi-address-shipping`：多地址各筆收件地址欄位新增郵遞區號提示文字需求

## Impact

- `components/course-session/material-order-dialog.tsx`：兩處收件地址 `FormField` 下方新增提示文字（`FormDescription` 或等效 `<p>`）。
- `messages/zh-TW.json`、`messages/en.json`：新增 `course.material.deliveryAddressHint` key；`messages/zh-CN.json` 透過 `npm run gen:zh-cn` 重新產生。
- 純前端文案異動，無資料庫、API、驗證邏輯變更，無 migration。
