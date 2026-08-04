## Why

`cr-spec-260804-001`／`004` 建立的「會員標籤」「會員文字元件」目前版面較零散（啟動編號與身分標籤同列在上、頭像與顯示名稱在下、操作按鈕另外擠在側邊），且顯示內容缺少「單位」「性別」「真實姓名」等後台核心辨識資訊。文字元件目前顯示「啟動編號＋顯示名稱」，未明確標示真實姓名，後台情境需要的正是真實姓名（沿用證書製作頁既有的「真實姓名為辨識依據」原則）。

## What Changes

- **會員文字元件文字樣式調整**：觸發文字由「啟動編號＋顯示名稱」SHALL 改為「顯示名稱（真實名稱）」；真實姓名缺漏或與顯示名稱相同時 SHALL 僅顯示顯示名稱，不顯示空括號或重複文字。
- **會員標籤版面重新設計為左右兩欄**：左欄 SHALL 為頭像；右欄由上至下依序 SHALL 列出：啟動編號、單位（所屬教會／自填單位，未填顯示「—」）、顯示名稱（真實名稱）＋性別 icon（同一列）、身分標籤、操作按鈕（檢視／訊息，行為不變）。「顯示名稱（真實名稱）」該行文字 SHALL 較其餘欄位文字更清楚（字級/字重加強）。
- **`MemberTagInfo` 資料契約擴充**：新增 `realName: string | null`、`gender: Gender`、`churchLabel: string | null` 三個欄位，供以上兩處使用；既有消費端（教材申請頁講師、證書製作頁學員）SHALL 一併補齊這些欄位的資料來源。
- **抽出共用性別 icon 元件**：證書製作頁既有的 `GenderIcon`（僅該頁內部使用）SHALL 抽出為共用元件，供會員標籤重用，避免重複實作。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `admin-member-tag`：修改「會員標籤顯示內容」（新增單位/性別/真實姓名、兩欄版面）與「會員文字元件」（文字樣式改為顯示名稱（真實名稱））兩則需求

## Impact

- **UI**：新增 `components/shared/gender-icon.tsx`（`Gender` 型別＋ `GenderIcon` 元件，由 `certificates/page.tsx` 既有的本地實作抽出）；`components/admin/member-tag.tsx` 版面改為左右兩欄；`components/admin/member-text-tag.tsx` 觸發文字格式調整。
- **共用邏輯**：`lib/utils/member-display.ts` 新增 `withRealName(displayName, realName)` 小工具，供兩元件共用「顯示名稱（真實名稱）」格式化邏輯（含空值/重複的省略規則）。
- **Data Layer**：
  - `lib/data/course-order.ts`：`createdBy` select 新增 `gender`／`church`／`churchOther`；`instructor` 組裝補上 `realName`／`gender`／`churchLabel`。
  - `lib/data/certificate.ts`：`member` 組裝補上既有已查詢但尚未帶入的 `realName`／`gender`／`churchLabel`（資料已在既有查詢範圍內，無需擴充 select）；`CertificateGender` 型別移除，改用共用 `Gender` 型別。
- **UI 呼叫端**：`certificates/page.tsx` 改為從共用元件 import `GenderIcon`／`Gender`，移除本地重複定義。
- **不修改**：`MemberTag`／`MemberTextTag` 的操作按鈕行為（檢視/訊息）、既有的頭像三層 fallback 與身分標籤計算邏輯。

## Non-Goals

- 不變更 `MemberTagInfo` 以外的其他既有型別／資料流。
- 不處理教材申請頁、證書製作頁除會員標籤呈現方式外的其他版面或邏輯。
