# Tasks — 匯款帳號改為多行「匯款帳號資訊」

## 1. 預設值與資料層

- [x] 1.1 `lib/data/admin-settings.ts`：`REMITTANCE_ACCOUNT_DEFAULT` 改為多行 template literal（第一銀行淡水分行／戶名：希望之聲文化有限公司／銀行代碼：007／帳號：218-10-002087）

## 2. 輸入端改 textarea

- [x] 2.1 `components/admin/remittance-account-form.tsx`：`<Input>` 改 `<Textarea rows={4}>`，placeholder 改為多行範例格式，標籤／訊息文案改「匯款帳號資訊」，寬度調整（`w-56` 改為適合多行的寬度）
- [x] 2.2 `components/admin/material-quote-dialog.tsx`：帳號欄 `<Input>` 改 `<Textarea rows={4}>`，label 改「匯款帳號資訊 *」，placeholder 改多行範例
- [x] 2.3 `app/[locale]/(admin)/admin/settings/settings-tabs.tsx`：區塊標題與說明文字改「教材匯款帳號資訊」

## 3. 呈現端保留換行

- [x] 3.1 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：待付款區塊將 `remittanceAccount` 由行內 `<strong>` 改為獨立 `<p className="whitespace-pre-wrap font-medium">` 區塊，前導文字「教材費用 NT$X，請匯款至：」
- [x] 3.2 `components/admin/material-order-table.tsx`：訂單詳情「匯款帳號資訊」改為 label 在上、`whitespace-pre-wrap` 內容在下的區塊（脫離 two-column grid 行內格式）
- [x] 3.3 `app/[locale]/(user)/notifications/page.tsx`：通知 body 加 `whitespace-pre-wrap`

## 4. 批價通知格式

- [x] 4.1 `app/actions/course-order.ts` `quoteMaterialOrder`：通知內文改為「「課程」教材費用為 NT$X，請匯款至：\n{account}\n完成後請回填匯款後五碼。」（多行帳號資訊換行附上）

## 5. 驗證與收尾

- [x] 5.1 `npm run lint` 與 `npm run build` 通過
- [x] 5.2 手動驗證：後台設定儲存多行資訊 → 批價對話框預設帶入 → 批價後老師課程頁、後台詳情、通知列表頁皆逐行呈現
- [x] 5.3 更新 `doc/管理者操作手冊.md`（設定頁與批價流程）與 `doc/老師手冊.md`（繳費資訊呈現），更新檔首版本與日期
- [x] 5.4 `config/version.json` patch +1、`updatedAt` 更新為套用日；依 `.ai-rules.md` 重新產生 `README-AI.md`
