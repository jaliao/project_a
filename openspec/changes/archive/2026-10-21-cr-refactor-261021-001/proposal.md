## Why

`/code-review` 針對 CR-FEAT-261021-002 新增的「世代倍增」raw data 匯出功能，指出三個效能/重複程式碼問題：
1. `app/api/admin/dashboard/generations/export/route.ts` 每次下載都呼叫 `getAvailableReportMonths()`（對 `InviteEnrollment` 全表做 `MIN(joinedAt)` 聚合）只是為了驗證 `?month=` 格式，其實下載連結來自頁面自身已驗證過的月份值，單純格式檢查即可。
2. `lib/data/monthly-report.ts` 的 `generationTeacherDetails()` 先查一次 enrollment 取得教師/導師 id，再另外發一次 `prisma.user.findMany` 查姓名，兩次查詢可合併為一次。
3. 三份匯出端點（`members/export`、`members/unrecovered/export`、`generations/export`）各自重複一份幾乎相同的「auth 檢查 + xlsx 產出 + Content-Disposition」樣板，未抽共用邏輯。

## What Changes

- `generations/export/route.ts` 改為純正規表達式驗證 `?month=YYYY-MM` 格式；格式不合法時直接回 400，**不再**呼叫 `getAvailableReportMonths()` 查資料庫判斷「是否在可選範圍內」。
- `generationTeacherDetails()` 的 enrollment 查詢 `select` 直接帶出 `invite.createdBy.{spiritId, realName}`，在同一次查詢迴圈中建立教師/導師姓名對照表，移除原本額外的 `prisma.user.findMany`。
- 新增共用 helper `lib/utils/xlsx-export.ts`：`requireAdminSession()`（auth + admin 角色檢查，失敗回 401 `NextResponse`）、`xlsxDownloadResponse(rows, sheetName, filename)`（xlsx 產出與下載標頭）。三份既有匯出端點（`members/export`、`members/unrecovered/export`、`generations/export`）改用此 helper，移除各自重複的樣板程式碼。

## Capabilities

### Added Capabilities

（無）

## Impact

- **修改** `app/api/admin/dashboard/generations/export/route.ts`：改用正規表達式驗證月份格式（不合法回 400），改用共用 xlsx helper。
- **修改** `lib/data/monthly-report.ts`：`generationTeacherDetails()` 合併查詢，移除額外的 `user.findMany`。
- **新檔** `lib/utils/xlsx-export.ts`：共用 auth 檢查與 xlsx 下載 response helper。
- **修改** `app/api/admin/members/export/route.ts`、`app/api/admin/members/unrecovered/export/route.ts`：改用共用 helper，移除重複的 auth 檢查與 xlsx 產出程式碼，其餘資料查詢與欄位組裝邏輯不變。
- **行為變更**：`generations/export` 端點收到格式不合法的 `?month=` 時，由原本「回退為上一個完整月份」改為直接回 400 Bad Request（其餘兩份匯出端點本來就不吃 `month` 參數，不受影響）。
- **不需要**資料庫 schema 變更、不影響操作手冊（手冊未描述這類邊界情況的錯誤處理細節）。
- **版本號**：`config/version.json` patch +1。
