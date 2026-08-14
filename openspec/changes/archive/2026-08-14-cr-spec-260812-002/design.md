## Context

`material-order-dialog.tsx` 的加購項目（`ExtraItemRow`）目前僅是一個無驗證的自由輸入框：`bookName?: string`，未填時由 `app/actions/course-order.ts` 的 `resolveItems` 在伺服器端 fallback 為 `'額外加購'`。8/7 review 要求把這個「選填＋預設值」行為改成「必填」，且輸入框 placeholder 同時簡化文字、去除括號註明——這使得本次變更不再是純文案調整，需要決定必填驗證要如何呈現錯誤訊息。

## Goals / Non-Goals

**Goals:**
- 加購項目書名改為必填，未填寫時阻擋送出並顯示錯誤訊息，行為與其他必填欄位（收件人、連絡電話、收件地址）一致。
- 其餘 6 項純文案調整維持最小改動，只動 i18n 內容與少數需要同步移除的 JSX 行。

**Non-Goals:**
- 不重構 `SingleBookList`／`BookAssignList`／`ExtraItemRow` 三者的資料流（維持現有「直接以 `items` 陣列 + `setValue` 操作」寫法，不改用 `useFieldArray`）。
- 不處理既有訂單歷史資料的回溯修正（過去以「額外加購」為書名快照的訂單維持原樣）。
- 不擴大「書本→教材」文案統一的範圍到後台頁面（見 proposal.md Impact 範圍排除說明）。

## Decisions

1. **`bookName` 必填驗證：`z.string().trim().min(1, 'validation.bookNameRequired')`，而非額外寫 `superRefine`**
   `orderBookItemInputSchema` 是 `discriminatedUnion` 內的欄位層級驗證，用標準 `.trim().min(1)` 即可表達「必填、且純空白視為未填」，不需要額外自訂邏輯；與同檔案內 `recipientName`／`recipientPhone` 在 `shipmentItemSchema` 用 `.min(1, '...')` 的風格一致（差別僅在多了 `.trim()`，因為 `bookName` 是自由輸入、`recipientName` 目前沒有 trim 前例但語意上更需要防止純空白書名）。

2. **移除伺服器端 fallback，而非保留作為防禦層**
   `resolveItems` 內 `input.bookName?.trim() || '額外加購'` 一旦 schema 已保證 `bookName` 為非空字串，這段 fallback 永遠不會被觸發（`materialOrderSchema.safeParse` 失敗會在此之前就 return `{ success: false }`）。保留永遠不會執行的分支違反「不要為不可能發生的情境寫防禦邏輯」的專案慣例，直接移除、改用 `input.bookName`（此時型別已是必填 `string`）。

3. **`ExtraItemRow` 新增 `errorMessage` prop，由呼叫端（`SingleBookList`／`BookAssignList`）算出巢狀路徑錯誤訊息**
   `items` 目前不是透過 `useFieldArray` 註冊（而是 `form.watch('items')` + `form.setValue` 直接操作），所以 `zodResolver` 驗證失敗後的巢狀錯誤（`errors.items[idx].bookName`／`errors.shipments[index].items[idx].bookName`）不會自動綁定到某個 `<FormField name="...">`。最小改動做法：`ExtraItemRow` 增加一個可選的 `errorMessage?: string` prop，直接渲染 `<FieldError message={errorMessage} />`；兩個呼叫端在既有 `extraIndexes.map` 迴圈內，用 `idx`／`index` 從 `form.formState.errors` 對應路徑讀值傳入即可，不需要把整個元件改為 `useFieldArray` 註冊（避免大範圍重構，維持本次變更聚焦於 8/7 review 的 7 個項目）。
   驗證時機沿用表單既有預設（`useForm` 未設 `mode`，即預設 `onSubmit`）：與 `recipientName`／`deliveryAddress` 等既有必填欄位一致，僅在送出時才觸發驗證與錯誤顯示，不需要額外設定。

4. **`unassignedHint`／`noDemandHint` 兩個 i18n key 直接刪除，不保留為未使用的 dead key**
   兩者被移除後在程式碼中不再有任何引用，比照專案「確定不用就整個刪除，不留 `// removed` 註解或殘留 key」的慣例。

## Risks / Trade-offs

- **[低風險] 既有「多次申請」流程中，若使用者已針對某筆加購項目留空書名並曾經送出成功（此次變更前）**：那些歷史訂單資料不受影響（快照已寫入 DB，`bookName='額外加購'`）；本次變更僅影響「之後新建的加購項目」需要填寫書名才能送出，無資料相容性問題。

## Migration Plan

1. `messages/zh-TW.json`／`messages/en.json`：`course.material` 命名空間 7 項文案調整＋新增 `validation.bookNameRequired`；`npm run gen:zh-cn`。
2. `lib/schemas/course-order.ts`：`orderBookItemInputSchema` 的 `extra.bookName` 改必填。
3. `app/actions/course-order.ts`：移除 `resolveItems` 的預設值 fallback。
4. `components/course-session/material-order-dialog.tsx`：`ExtraItemRow` 加 `errorMessage` prop；`SingleBookList`／`BookAssignList` 傳入對應路徑錯誤訊息；移除 `unassignedHint` 那一行 `<p>`。
5. `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：移除 `noDemandHint` 的 `<li>`。
6. `npx tsc --noEmit` + `npm run lint`。

**Rollback：** 純前端文案／驗證規則變更，無 schema migration，revert commit 即可還原；既有訂單資料不受影響。
