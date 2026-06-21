## Why

目前申請書本（教材）流程為「老師申請 → 管理者寄送 → 老師收件」，缺少繳費環節。實務上需先收款再出貨：管理者依申請批價並提供匯款帳號，老師自行 ATM 轉帳後回填後五碼，管理者確認收款後才寄送。本變更在現有教材流程中插入完整金流繳費流程。

## What Changes

- **新增訂單付款狀態機**（單一金額／整張訂單）：待批價 → 待付款 → 待確認收款 → 待寄送 →（已寄送 → 已收件）。
- **管理者批價**：對申請填寫「金額」與「匯款帳號」（帳號預設帶入系統設定值，可改），送出後通知老師。
- **老師收到批價通知**：於課程頁看到金額與匯款帳號，自行 ATM 轉帳後**回填匯款後五碼**。
- **管理者確認收款**：核對後點「確認收款」，方解鎖寄送。
- **寄送 gating**：`confirmShipment`／批次寄送 SHALL 僅在「已確認收款」後可執行。
- **批價後鎖定申請**：訂單一旦批價，`applyMaterialOrder` SHALL 拒絕修改。
- **匯款帳號系統設定**：`/admin/settings` 新增可設定的匯款帳號，測試環境預設 `08-2345-6789`。
- CourseOrder 新增付款欄位；管理頁與課程頁狀態標籤新增付款相關狀態。

## Capabilities

### New Capabilities
- `material-order-payment`: 教材訂單金流繳費流程 —— 批價、匯款帳號設定、老師回填後五碼、管理者確認收款、寄送 gating、通知與狀態機。

### Modified Capabilities
- `course-order`: `CourseOrder` 新增付款欄位（金額／匯款帳號／批價與付款時間／後五碼）；`applyMaterialOrder` 於訂單已批價後 SHALL 拒絕修改（鎖定申請）。
- `admin-material-management`: 管理頁新增「批價」「確認收款」操作與付款狀態標籤；「確認已寄送」SHALL 僅在已確認收款後可用。

## Impact

- `prisma/schema/course-order.prisma`：`CourseOrder` 新增 `quotedAmount`、`remittanceAccount`、`quotedAt`、`paymentLast5`、`paymentReportedAt`、`paymentConfirmedAt` → 需 migration。
- `app/actions/course-order.ts`：新增 `quoteMaterialOrder`、`reportMaterialPayment`、`confirmMaterialPayment`；`confirmShipment`／`confirmShipmentBatch` 加入「已確認收款」前置檢查；`applyMaterialOrder` 加入「已批價即鎖定」檢查。
- `lib/data/admin-settings.ts`：匯款帳號設定（key `remittance_account`，預設 `08-2345-6789`）；`/admin/settings` 頁新增欄位（`app/actions/admin-settings.ts`）。
- 管理頁 `components/admin/material-order-table.tsx`：批價／確認收款 UI、付款狀態標籤。
- 課程頁老師端 `app/(user)/course/[id]/`：顯示批價結果＋匯款帳號、回填後五碼表單。
- 通知：批價完成、確認收款 → `createNotification` 通知老師。
- `lib/data/course-sessions.ts`、`lib/data/course-order.ts`：查詢帶出新付款欄位。
- `config/version.json` patch +1；依 CLAUDE.md 第 9 點更新老師手冊（繳費流程）與管理者手冊（批價／確認收款）。
