## Why

cr-spec-260628-002 讓一門課可有多筆教材訂單，但講師端教材區塊只是逐筆列出訂單，無法一眼看出「整門課還有多少教材沒申請」，且每筆申請看不到實際的書籍種類與數量。講師難以掌握申請進度，也容易重複或漏申請。需重整講師操作區為清楚的三段式作業流程，並把教材申請做成可追蹤的「總需求 / 已申請 / 尚未申請」進度。

## What Changes

- **講師操作區改為三個上下堆疊的區塊**，每塊皆為「標題 → 說明 → 動作按鈕」結構，順序固定：
  1. **教材申請作業**：說明區顯示本課程教材的**總需求 / 已申請 / 尚未申請**（繁體、簡體分列）；逐筆列出每筆教材申請的**書籍種類與數量**及其狀態／進度；**「申請教材」按鈕僅在「尚未申請 > 0」時可按**。
  2. **開始上課作業**：說明區含**注意事項**（與開課門檻未達原因）；動作按鈕為 **開始上課**。
  3. **取消上課作業**：說明從簡，僅提供 **取消授課** 動作按鈕。
- **每筆教材申請記錄繁/簡數量**。**BREAKING（schema）**：`CourseOrder` 新增 `traditionalQty` / `simplifiedQty`。
  - **單一地址**：申請時**自動帶入當下「尚未申請」的繁/簡數量**（不需手動填，等同「把剩餘的全部寄到一個地址」），並寫入該訂單。
  - **多地址**：講師於各寄送地址分配繁/簡本數，各批次加總 SHALL 等於該筆訂單的繁/簡數量；總和受「尚未申請」剩餘量上限限制。
- **總需求**以已核准學員的 `materialChoice` 統計為準（沿用 `getEnrollmentMaterialSummary`）；**已申請**為該課程所有教材訂單繁/簡數量加總；**尚未申請** = 總需求 − 已申請。
- **不允許超額申請**：單筆申請的繁/簡數量不得超過當下「尚未申請」之剩餘量；剩餘為 0 時停用申請按鈕。
- **前台與後台皆需呈現每筆訂單的書籍種類與數量**：講師端（課程詳情訂單清單）與管理端（教材管理列表、出貨單列印）皆顯示該筆訂單的繁/簡本數。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-multi-material-order`: 教材申請新增每筆繁/簡數量與「總需求／已申請／尚未申請」進度；申請按鈕受「尚未申請 > 0」限制與不可超額；講師操作區改為三區塊（教材申請／開始上課／取消上課）上下堆疊，每塊含標題/說明/動作；每筆訂單顯示書籍種類與數量。

## Impact

- Schema：`prisma/schema/course-order.prisma`（`CourseOrder` 新增 `traditionalQty` / `simplifiedQty`，預設 0）；需 migration（既有訂單回填：多地址以 shipment 加總、單一地址預設 0 或依現況）
- 驗證：`lib/schemas/course-order.ts`（申請表單新增繁/簡數量欄位與規則）
- Server actions：`app/actions/course-order.ts`（`applyMaterialOrder` 寫入繁/簡數量、剩餘量上限驗證、多地址批次加總一致性）
- 資料層：`lib/data/course-sessions.ts`（`CourseSessionOrder` 帶 `traditionalQty`/`simplifiedQty`；課程詳情衍生 總需求／已申請／尚未申請）、`lib/data/course-order.ts`（後台列表/列印型別帶繁/簡數量）
- UI（前台）：`app/(user)/course/[id]/course-detail-actions.tsx`（三區塊重整、每筆訂單顯示繁/簡）、`app/(user)/course/[id]/page.tsx`（傳入進度數據）、`components/course-session/material-order-dialog.tsx`（單一地址自動帶剩餘、多地址分配與剩餘提示）
- UI（後台）：`components/admin/material-order-table.tsx`（列表/詳情顯示繁/簡數量）、`app/(user)/admin/materials/[id]/print/page.tsx`（出貨單顯示繁/簡數量）
- 文件：依 CLAUDE.md 第 9 點同步 `doc/老師手冊.md`、`doc/管理者操作手冊.md`；版本號 +1
