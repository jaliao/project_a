## Why

目前學員頁面「身分標籤」只顯示單一標籤（`learningLevel` 對應的「啟動靈人 N 學員」），無法反映使用者多重身分（如系統管理員、各等級講師），且標籤來源不夠精確（learningLevel 為手動欄位）。

## What Changes

- 身分標籤改為多標籤顯示（可同時顯示多個 Badge）
- 新增「系統管理員」標籤：條件為 `User.role = admin | superadmin`
- 新增「啟動靈人 N 講師」標籤：條件為擁有對應等級的結業證書（`InviteEnrollment.graduatedAt` 有值）
  - 啟動靈人 1 講師 ← 啟動靈人 1 結業證書
  - 啟動靈人 2 講師 ← 啟動靈人 2 結業證書（依此類推）
- 移除原有基於 `learningLevel` 的單一「啟動靈人 N 學員」標籤

## Capabilities

### New Capabilities
- `identity-tags`: 使用者身分標籤計算與顯示邏輯（多標籤、來源：role + 結業證書）

### Modified Capabilities
- `user-profile`: 身分標籤顯示從單一 Badge 改為多 Badge 陣列

## Impact

- **修改**: `app/(user)/user/[spiritId]/page.tsx` — 身分標籤區塊改為多 Badge；新增 `role` 欄位查詢；使用現有 `certificates`（`getMyCompletionCertificates`）推導講師標籤
- **不需要**: DB schema 變更（利用現有 `role` 與 `InviteEnrollment.graduatedAt`）
