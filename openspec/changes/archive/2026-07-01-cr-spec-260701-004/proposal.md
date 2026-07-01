## Why

cr-spec-260701-003 讓「多地址」教材寄送以逐本項目（學員書本名字＋版本）呈現與列印，但「單一地址」訂單仍只顯示繁/簡數量、看不到學員名稱與書本名字，列印出貨單也沒有書本清單。管理者要製作「印上名字」的書時，單一地址情境缺少可對照的清單。需讓單一地址也呈現書本清單。

## What Changes

- 單一地址（`shipMode = single`）教材訂單，於後台詳情與出貨單列印**顯示該課程的書本項目清單**（學員名稱＋書本名字＋版本繁/簡）。
- 書本清單由該課程報名推導（`getCourseBookItems(courseInviteId)`，已核准且選了版本者），單一地址視為全部書送至該地址；不需寫入模型（無 migration）。
- 多地址呈現維持 003 現狀（依各地址已指派項目）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `material-book-items`: 單一地址訂單亦以逐本項目（學員名＋書本名字＋版本）呈現（由課程報名推導）。
- `admin-material-management`: 教材申請詳情與出貨單列印，單一地址亦顯示書本清單。

## Impact

- `lib/data/course-order.ts`：`CourseOrderWithInvite` / `CourseOrderForPrint` 於 `shipMode = single` 附上課程書本項目清單（型別新增欄位，如 `bookItems`）
- `components/admin/material-order-table.tsx`：單一地址詳情區塊列出書本清單（現只有繁/簡數量）
- `app/[locale]/(admin)/admin/materials/[id]/print/page.tsx`：單一地址出貨單帶出書本清單
- `doc/管理者操作手冊.md`、`config/version.json`、README-AI
- 無 DB migration（純顯示；沿用 `lib/data/material-items.ts` 的 `getCourseBookItems`）
