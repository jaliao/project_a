# Design — 匯款帳號改為多行「匯款帳號資訊」

## Context

教材繳費流程中，匯款帳號目前為單行字串（預設 `08-2345-6789`），流經三個層面：

1. **系統設定**：`AdminSetting` key `remittance_account`（`lib/data/admin-settings.ts`），後台設定表單為單行 `<Input>`
2. **批價快照**：`quoteMaterialOrder` 將帳號寫入 `CourseOrder.remittanceAccount`，批價對話框亦為單行 `<Input>`
3. **呈現**：老師端課程頁待付款區塊（行內 `<strong>` 拼接）、後台訂單詳情、批價通知訊息（行內拼接於句中）

實際匯款需要完整資訊（多行）：

```
第一銀行淡水分行
戶名：希望之聲文化有限公司
銀行代碼：007
帳號：218-10-002087
```

系統未上線、無正式資料，不需考慮既有單行資料相容。

## Goals / Non-Goals

**Goals:**
- 設定與批價的帳號欄改為 textarea，支援多行輸入
- 所有呈現端（老師課程頁、後台訂單詳情、通知）保留換行格式
- 預設值與 placeholder 更新為實際銀行資訊

**Non-Goals:**
- 不做結構化欄位（銀行／戶名／代碼／帳號分欄）——維持自由文字，格式由管理者掌控
- 不改資料庫 schema（String 欄位可直接存放換行）
- 不改付款狀態機與後五碼回填流程

## Decisions

### 1. 自由多行文字，不結構化

以單一 textarea 存整段文字，而非拆成銀行/戶名/代碼/帳號四欄。理由：資訊僅供人閱讀（老師照著匯款），無程式邏輯依賴個別欄位；自由文字讓管理者可自行增減行（如加註「請備註課程編號」）。

### 2. 輸入元件用既有 `components/ui/textarea.tsx`

兩處輸入（設定表單、批價對話框）改用 shadcn `<Textarea>`，`rows={4}`，placeholder 帶入完整範例格式。驗證維持「trim 後非空」即可，不限制行數。

### 3. 呈現一律 `whitespace-pre-wrap`

比照 codebase 既有慣例（course-faq、graduation-form 等皆用 `whitespace-pre-wrap`）。需調整的呈現端：

- **老師端待付款區塊**（`course-detail-actions.tsx`）：帳號由行內 `<strong>{account}</strong>` 改為獨立區塊 `<p className="whitespace-pre-wrap font-medium">`，上一行維持「教材費用 NT$X，請匯款至：」
- **後台訂單詳情**（`material-order-table.tsx`）：「匯款帳號資訊」項改為 label 在上、多行內容在下（原 two-column grid 的行內格式放不下多行）
- **通知列表頁**（`notifications/page.tsx`）：body 加 `whitespace-pre-wrap`；抽屜預覽（`notification-drawer.tsx`）維持 `line-clamp-2` 截斷，屬合理預覽行為

### 4. 批價通知改為換行附帳號資訊

原：`「課程」教材費用為 NT$X，請匯款至 ${account}，完成後回填匯款後五碼。`（行內拼接，多行會破句）

改：

```
「課程」教材費用為 NT$X，請匯款至：
第一銀行淡水分行
戶名：希望之聲文化有限公司
銀行代碼：007
帳號：218-10-002087
完成後請回填匯款後五碼。
```

### 5. 預設值更新為實際銀行資訊

`REMITTANCE_ACCOUNT_DEFAULT` 改為上述四行（template literal）。欄位標籤統一改為「匯款帳號資訊」。

## Risks / Trade-offs

- [通知抽屜 `line-clamp-2` 只顯示前兩行] → 屬預覽性質；點入通知列表頁可見完整多行內容，且課程頁待付款區塊為主要資訊來源
- [自由文字無格式驗證，管理者可能存入排版混亂內容] → placeholder 提供標準格式範例；資訊僅供人讀，風險低
- [DB 既有單行快照與新多行格式並存] → 系統未上線無正式資料，seed 重建即可，不需遷移

## Open Questions

（無）
