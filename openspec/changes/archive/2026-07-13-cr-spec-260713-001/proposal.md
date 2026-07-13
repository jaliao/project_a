# 匯款帳號改為多行「匯款帳號資訊」（cr-spec-260713-001）

## Why

教材繳費的匯款帳號目前為單行文字（如 `08-2345-6789`），但實際匯款需要提供完整資訊（銀行分行、戶名、銀行代碼、帳號）。單行 input 無法輸入與呈現多行格式，老師端看到的資訊不足以完成匯款。

## What Changes

- 「匯款帳號」設定與批價欄位由單行 input 改為 **textarea**，支援多行「匯款帳號資訊」：
  - 後台系統設定表單（`components/admin/remittance-account-form.tsx`）
  - 教材批價對話框（`components/admin/material-quote-dialog.tsx`）
- 畫面呈現保留換行格式（`whitespace-pre-line` 或等效方式）：
  - 老師端課程頁「待付款」區塊（`app/[locale]/(user)/course/[id]/course-detail-actions.tsx`）——匯款資訊由行內 `<strong>` 改為區塊多行呈現
  - 後台教材訂單表（`components/admin/material-order-table.tsx`）的「匯款帳號」欄
- 批價通知訊息（`quoteMaterialOrder` 的 `createNotification`）調整格式，多行帳號資訊改以換行附於訊息後，避免行內拼接破版
- 測試環境預設值 `REMITTANCE_ACCOUNT_DEFAULT` 與相關 placeholder 更新為新的多行格式：

  ```
  第一銀行淡水分行
  戶名：希望之聲文化有限公司
  銀行代碼：007
  帳號：218-10-002087
  ```

- 欄位標籤由「匯款帳號」改為「匯款帳號資訊」（設定頁、批價對話框、訂單顯示）
- **無資料庫 schema 變更**：`AdminSetting.value` 與 `CourseOrder.remittanceAccount` 皆為 String，可直接存放多行文字

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `material-order-payment`：匯款帳號系統設定改為多行「匯款帳號資訊」（textarea、預設值更新）；老師端待付款區塊呈現須保留換行；批價通知訊息格式調整
- `admin-material-management`：批價對話框帳號欄改 textarea；管理頁訂單「匯款帳號」顯示保留換行

## Impact

- **UI 元件**：`remittance-account-form.tsx`、`material-quote-dialog.tsx`、`material-order-table.tsx`、`course-detail-actions.tsx`
- **Server Actions**：`app/actions/admin-settings.ts`（驗證維持必填即可）、`app/actions/course-order.ts`（通知訊息格式）
- **Data Layer**：`lib/data/admin-settings.ts`（`REMITTANCE_ACCOUNT_DEFAULT` 更新）
- **資料庫**：無 migration
- **手冊**：`doc/管理者操作手冊.md`（設定頁與批價流程）、`doc/老師手冊.md`（繳費資訊呈現）需同步更新；`config/version.json` patch +1（依 CLAUDE.md 第 7、9 點）
