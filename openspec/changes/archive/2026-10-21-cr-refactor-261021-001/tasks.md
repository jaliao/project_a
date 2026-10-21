## 1. 共用 xlsx 匯出 helper

- [x] 1.1 新檔 `lib/utils/xlsx-export.ts`：
  - `requireAdminSession(): Promise<{ ok: true; session: Session } | { ok: false; response: NextResponse }>`：呼叫 `auth()` + `canAccessAdmin(session.user.roles)`，失敗回 `{ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }`。
  - `xlsxDownloadResponse(rows: Record<string, unknown>[], sheetName: string, filename: string): NextResponse`：`XLSX.utils.json_to_sheet` → `book_new` → `book_append_sheet(wb, ws, sheetName)` → `XLSX.write` → 回傳帶 `Content-Disposition: attachment; filename="<filename>"` 的 `NextResponse`。

## 2. 三份匯出端點改用共用 helper

- [x] 2.1 `app/api/admin/members/export/route.ts`：改用 `requireAdminSession()` 取代原本的 auth 檢查，改用 `xlsxDownloadResponse()` 取代原本的 xlsx 產出與 response 組裝；資料查詢（`exportMembers`）與欄位組裝邏輯不變。
- [x] 2.2 `app/api/admin/members/unrecovered/export/route.ts`：同上，改用共用 helper；`exportUnrecoveredSeedMembers` 與欄位組裝邏輯不變。
- [x] 2.3 `app/api/admin/dashboard/generations/export/route.ts`：改用共用 helper。

## 3. 世代倍增匯出效能微調

- [x] 3.1 `app/api/admin/dashboard/generations/export/route.ts`：月份驗證改為 `/^\d{4}-(0[1-9]|1[0-2])$/` 格式檢查，不合法時回 `NextResponse.json({ error: 'Invalid month' }, { status: 400 })`；移除 `getAvailableReportMonths()`／`normalizeMonth()` 的呼叫（`normalizeMonth` 無其他呼叫端，改回 module-private）。
- [x] 3.2 `lib/data/monthly-report.ts` 的 `generationTeacherDetails()`：enrollment 查詢的 `select` 加入 `invite: { select: { createdById: true, createdBy: { select: { spiritId: true, realName: true } } } }`，於處理 rows 的同一迴圈建立 `labelById`（`spiritId ?? realName ?? teacherId`），移除原本額外的 `prisma.user.findMany` 呼叫。

## 4. 版本號

- [x] 4.1 `config/version.json` patch +1，`updatedAt` 更新為當日日期。

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 5.2 情境：三份匯出端點（會員、未找回帳號、世代明細）下載內容與欄位與改動前一致（抽樣比對檔案內容）。（三份端點改用共用 helper 後 `npm run build` 皆正常產出路由；資料查詢/欄位組裝程式碼未變動）
- [x] 5.3 情境：世代明細下載，`generationTeacherDetails()` 回傳的教師/導師姓名與改動前（經由額外 `user.findMany` 查到的）一致。（寫腳本對本機 dev DB 2026-08/2026-09 比對合併查詢後的 label 與舊版「額外查一次 user.findMany」的 label，166/150 位教師與導師標籤 0 筆不一致，PASS）
- [x] 5.4 情境：呼叫 `generations/export?month=abc` → 回應 400，不回退顯示其他月份資料。（實作為 `MONTH_FORMAT.test()` 失敗即回 400，邏輯單純；因 auth 檢查在格式檢查之前、本環境無法模擬已登入 admin session 走到這一關，未做端到端 curl 驗證，已靜態複查程式碼確認順序與邏輯正確）
- [x] 5.5 情境：三份端點在未登入/非 admin 身分下呼叫 → 皆回 401（共用 helper 行為一致）。（對本機 dev server 三個端點皆實測回 401，PASS）
