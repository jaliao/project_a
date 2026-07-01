## Why

後台「教材申請管理」列表目前夾雜對撿貨/出貨幫助不大的欄位（教材版本、數量），卻缺少能快速定位課程的「課程編號」；更關鍵的是：各收件地址在展開詳情時只顯示門市與繁/簡本數，**看不到收件人姓名與聯絡電話**（資料其實已存在），管理者出貨與客服聯繫時需逐筆翻查。需重整列表與收件資訊呈現，並提供「備註」供管理者記事。

## What Changes

- **列表欄位整理**（`material-order-table.tsx`）：
  - **移除**「教材版本」「數量」兩欄
  - **新增**「課程編號」欄（連結之 CourseInvite 識別碼）
- **收件資訊呈現**：單一地址與多地址寄送列，皆加上**收件人姓名 + 聯絡電話**（`lib/data/course-order.ts` 已 select，僅未呈現）。維持既有「取貨方式 — 門市（店號）」與「繁 X / 簡 Y」格式（範例：`7-11 取貨 — 大饌門市（184508）　繁 1 / 簡 0`）。
- **新增「備註」**：管理者可對訂單加註備註，於詳情顯示、編輯對話框可維護（**新欄位 → 需 migration**）。備註層級（訂單層 vs 各收件地址）與課程編號的確切來源於 design 階段定案。

## Capabilities

### New Capabilities

（無——本變更為既有後台管理能力的調整）

### Modified Capabilities

- `admin-material-management`: 教材申請列表欄位重整（移除教材版本/數量、新增課程編號）、各收件地址顯示收件人姓名與聯絡電話、新增訂單備註。

## Impact

- `components/admin/material-order-table.tsx`（列表欄位增刪；詳情單一/多地址列加收件人姓名+電話；備註顯示）
- `lib/data/course-order.ts`（select 課程編號 `courseInviteId`、備註欄位）
- `prisma/schema/course-order.prisma`（新增備註欄位 → migration）
- `components/admin/material-order-edit-dialog.tsx`（備註可編輯）
- 出貨單列印頁（`admin/materials/[id]/print`）若需同步收件人/備註，於 design 評估
- `doc/管理者操作手冊.md`（欄位與備註說明同步）
- 純後台、繁體（不在 i18n 範圍）
