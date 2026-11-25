## Why

後台「證書製作」頁（`/admin/certificates`）卡片目前以未加註標籤的粗體文字顯示真實姓名（中英並列）作為卡片主標題，其餘身分欄位（學員、學員編號、暱稱、老師、學員單位）皆有明確標籤。使用者檢視時覺得缺少明確標示的「姓名」欄位，且既有「暱稱」標籤不夠明確（容易與「學員」顯示名稱混淆），要求補上。

## What Changes

- 欄位清單新增一列「學員姓名：{realName} {englishName}」，與卡片主標題同一份資料。
- 現有「暱稱：」標籤文字改為「學員暱稱：」。
- 同步修正 `doc/管理者操作手冊.md` 的欄位說明與版本標註。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities
- `admin-certificate-production`：證書卡片欄位清單新增「學員姓名」列；「暱稱」欄位標籤改為「學員暱稱」。

## Impact

- `app/[locale]/(admin)/admin/certificates/page.tsx`：新增欄位列、修改標籤文字。
- `doc/管理者操作手冊.md`：欄位說明文字與版本標註同步。
- 不涉及 `lib/data/certificate.ts`（`realName`/`englishName` 已存在於既有查詢結果）、不影響資料庫 schema。
