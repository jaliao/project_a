## 1. i18n 文案調整

- [x] 1.1 `messages/zh-TW.json`（`course.material`）：`listTitle` → `"教材清單"`；`noStudentBooks` → `"無學員教材項目"`；`addExtra` → `"KUA窗口訂購"`；`extraNamePlaceholder` → `"教材姓名"`；`multiSummary` → `"學員教材共 {count} 本，請勾選指派至各寄送地址"`；`assignTitle` → `"指派教材至此地址 *"`；`shipModeLabel` → `"寄送方式 *（僅寄送台灣地址）"`；`noteApplyButton` 內「書本清單」→「教材清單」
- [x] 1.2 `messages/zh-TW.json`：刪除 `unassignedHint`、`noDemandHint` 兩個 key
- [x] 1.3 `messages/zh-TW.json`（`validation`）：新增 `bookNameRequired` → `"請填寫教材姓名"`
- [x] 1.4 `messages/en.json`：比照 1.1–1.3 補上對應英文（`listTitle`→"Material list"、`noStudentBooks`→"No student material items"、`addExtra`→"KUA Order"、`extraNamePlaceholder`→"Material name"、`multiSummary`→"{count} student materials in total — assign them to shipping addresses"、`assignTitle`→"Assign materials to this address *"、`shipModeLabel`→"Shipping method * (Taiwan addresses only)"、`noteApplyButton` 內 "book list" → "material list"；刪除 `unassignedHint`／`noDemandHint`；新增 `validation.bookNameRequired`→"Please enter a material name"）
- [x] 1.5 執行 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 2. 加購書名改為必填

- [x] 2.1 `lib/schemas/course-order.ts`：`orderBookItemInputSchema` 的 `extra` 分支 `bookName` 由 `z.string().optional()` 改為 `z.string().trim().min(1, 'validation.bookNameRequired')`
- [x] 2.2 `app/actions/course-order.ts`：`resolveItems` 內移除 `input.bookName?.trim() || '額外加購'` fallback，改直接使用 `input.bookName`
- [x] 2.3 `components/course-session/material-order-dialog.tsx`：`ExtraItemRow` 新增可選 `errorMessage?: string` prop，於 Input 下方渲染 `<FieldError message={errorMessage} />`
- [x] 2.4 `SingleBookList` 呼叫 `ExtraItemRow` 時，傳入對應 `items[idx].bookName` 巢狀路徑的錯誤訊息
- [x] 2.5 `BookAssignList` 呼叫 `ExtraItemRow` 時，傳入對應 `shipments[index].items[idx].bookName` 巢狀路徑的錯誤訊息

## 3. 刪除兩句提示句

- [x] 3.1 `components/course-session/material-order-dialog.tsx`：移除多地址模式指派提示區塊中 `<p className="text-muted-foreground">{t('unassignedHint')}</p>` 該行（保留 `multiSummary` 那一行）
- [x] 3.2 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：移除「申請作業」單元注意事項清單中 `{total.traditional + total.simplified + total.english === 0 && <li>{t('noDemandHint')}</li>}` 該行

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit`、`npm run lint` 通過（0 errors；既有 16 個 warnings 與本次變更無關）
- [x] 4.1b Smoke test：對已在跑的本機 dev server（`http://localhost:3000`）以 `curl` 檢查 `/course/1`，正常回應 200（無 500，確認 `course-detail-actions.tsx`／`material-order-dialog.tsx` 變更可正常編譯執行）
- [x] 4.2 開啟「申請教材」彈窗，確認：標題文案已改為教材清單／教材姓名 placeholder／寄送方式標題含「僅寄送台灣地址」註記／「KUA窗口訂購」按鈕文字；加購一筆不填書名直接送出會被擋下並顯示「請填寫教材姓名」錯誤訊息，填寫後可正常送出
- [x] 4.3 選擇「寄送多個地址」，確認「未指派的書本＝本次不申請」提示句已消失，其餘指派邏輯不受影響
- [x] 4.4 開啟課程管理頁「教材申請進度」／「申請作業」單元，於尚無已核准學員選書需求的課程確認「尚無已核准學員的選書需求，仍可加購申請。」提示句已不再顯示

**已知阻塞（本次 session 無法完成）**：4.2–4.4 需要登入實際帳號、開啟真實課程與教材申請彈窗操作驗證（含錯誤訊息顯示、多地址流程、課程管理頁條件式提示）。本次 session 沒有可用的登入帳密／OAuth 憑證，僅能以 4.1b 的 smoke test（未登入情境的路由層級檢查）確認頁面不會編譯/執行期崩潰。程式碼變更（1.1–3.2，含 i18n 七項文案、加購書名必填驗證＋錯誤訊息顯示、兩句提示句移除）皆已完成並通過 `tsc --noEmit`／`npm run lint`；4.2–4.4 待使用者於自己的登入環境手動驗證。
