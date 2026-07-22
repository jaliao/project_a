## 1. i18n 訊息檔（zh-TW 新增 key）

- [x] 1.1 `messages/zh-TW.json` `course.material` 命名空間新增：取貨方式標籤 `deliverySevenEleven`／`deliveryFamilyMart`／`deliveryDelivery`；Dialog 標題 `dialogTitleNew`／`dialogTitleView`；唯讀提示 `readonlyShipped`／`readonlyQuoted`；表單欄位 `taxIdLabel`／`shipModeLabel`／`shipModeSingle`／`shipModeMultiple`／`recipientNameLabel`／`recipientPhoneLabel`／`deliveryMethodLabel`／`storeLabel`／`deliveryAddressLabel`；按鈕 `addAddress`／`submitting`／`updateSubmit`／`submit`；地址列 `addressLabel`（ICU `{n}`）；toast fallback `applySuccessFallback`／`applyFailFallback`。
- [x] 1.2 `messages/zh-TW.json` `course.material` 命名空間新增內嵌訂單資訊用語：`deliveryMethodPrefix`／`recipientPrefix`／`shippedAtPrefix`／`receivedAtPrefix`／`bookQtyPrefix`（供 `MaterialOrderInfo`／`bookLabel`／`deliveryLine` 使用）。
- [x] 1.3 `messages/zh-TW.json` 新增 `course.actions` 命名空間：四區塊標題 `sectionMaterial`／`sectionStart`／`sectionGraduate`／`sectionReopen`／`sectionCancel`；開始上課相關 `startNote`／`startDateLabel`／`startButton`／`startConfirmTitle`／`startConfirmDate`／`startConfirmCount`／`startConfirmDesc`／`startSelectDateError`／`startSuccessToast`；結業相關 `graduateButton`／`graduateNoStudentsToast`；重新招募相關 `reopenDesc`／`reopenButton`／`reopenConfirmTitle`／`reopenConfirmDesc`；取消上課 `cancelButton`；通用 `cancel`／`processing`／`confirmStart`／`confirmReopen`。
- [x] 1.4 `messages/zh-TW.json` `validation` 命名空間新增 `materialOrderSchema`／`shipmentItemSchema`／`orderBookItemInputSchema` 所需 key（取貨方式必填、收件人必填、連絡電話必填、收件地址必填、版本必選、至少新增一個寄送地址、至少指派一本書、至少申請 1 本教材等，逐一比對 `lib/schemas/course-order.ts` 現有訊息）。

## 2. Zod schema 訊息 key 化

- [x] 2.1 `lib/schemas/course-order.ts`：`orderBookItemInputSchema` 兩個分支的 `version` enum 錯誤訊息（`請選擇版本`）改為 `validation.*` key。
- [x] 2.2 `lib/schemas/course-order.ts`：`shipmentItemSchema` 之 `recipientName`／`recipientPhone`／`deliveryMethod` 及 `superRefine`（門市/地址必填）訊息改為 key，注意 `ctx.addIssue` 的 `path` 維持不變。
- [x] 2.3 `lib/schemas/course-order.ts`：`materialOrderSchema` 之 `superRefine`（`shipMode='multiple'`/`single` 兩分支：至少新增一個寄送地址、至少申請 1 本教材、取貨方式必填、門市/地址必填）訊息改為 key。
- [x] 2.4 確認 `courseOrderSchema`（將於第 5 節整批刪除）維持原樣，不在本節處理。

## 3. material-order-dialog.tsx 在地化

- [x] 3.1 `DELIVERY_OPTIONS` 由模組層級常數改為元件內以 `t()` 組成（label 改查 `course.material.delivery*`），兩處使用（單一地址 `DELIVERY_OPTIONS.map` 與 `MultiAddressRow` 內 `DELIVERY_OPTIONS.map`）同步改讀取新結構。
- [x] 3.2 Dialog 標題（`title = existingOrder ? '查看教材申請' : '申請教材'`）與唯讀提示（`教材已寄出...`／`已批價...`）改用 `t()`。
- [x] 3.3 表單欄位 `FormLabel`（統一編號、寄送方式、單一/多地址選項、收件人、連絡電話、取貨方式、取貨門市、收件地址）與按鈕文字（新增寄送地址、送出中/更新申請/送出申請）改用 `t()`；`MultiAddressRow` 內「寄送地址 {index+1}」改用 ICU key。
- [x] 3.4 `MultiAddressRow` 內 `placeholder="收件人 *"`／`"連絡電話 *"`／`"收件地址"` 改用 `t()`。
- [x] 3.5 `onSubmit` 的 toast fallback（`教材申請已送出`／`送出失敗，請稍後再試`）改用 `t()` 作為 fallback（`result.message` 本身仍維持原樣，不變更 action 回傳值）。
- [x] 3.6 所有 `<FormMessage />`（表單欄位錯誤顯示處，含 `taxId`／`shipMode`／`recipientName`／`recipientPhone`／`deliveryMethod`／`storeId`／`deliveryAddress`／`SingleBookList`/`BookAssignList` 內兩處 `items`/`shipments.[].items` 錯誤）改為 `<FieldError message={...} />`（改用 `formState.errors.x?.message`／`fieldState.error?.message`），確保呈現的是翻譯後文字而非裸 key。

## 4. course-detail-actions.tsx 在地化

- [x] 4.1 `bookLabel` 函式改為接受已翻譯的版本標籤（`trad`/`simp`/`eng` 標籤文字）作為參數，呼叫端在元件內以 `t('versionShortTraditional')` 等組出後傳入，取代函式內部硬編碼的「繁」「簡」「英」。
- [x] 4.2 `DELIVERY_LABELS` 常數改為元件內以 `t()` 組成（沿用 3.1 新增的 `course.material.delivery*` key，與 `material-order-dialog.tsx` 共用同一組 key），`deliveryLine` 函式改為接受已解析的 label 作為參數。
- [x] 4.3 `MaterialOrderInfo` 元件內固定文字（「地址 {i+1}」、「取貨方式：」、「收件人：」、「寄送時間：」、「收件時間：」、「書本數量：」）改用 `t()`；版本縮寫判斷（`it.version === 'traditional' ? '繁' : ...`）改用 4.1 的翻譯標籤。
- [x] 4.4 四個非教材區塊（開始上課作業／結業作業／重新招募作業／取消上課作業）之 `<Section title="...">` 字面值改用 `t('course.actions.section*')`；「教材申請作業」區塊標題比照改用 `course.actions.sectionMaterial`（維持與其餘三單元 `course.material.*` key 並存不衝突）。
- [x] 4.5 開始上課區塊：注意事項文字、日期欄位 label、按鈕、確認視窗（標題/開課日期/上課人數/說明/取消/確認開始）、`toast.error('請選擇開始上課日期')`、`toast.success('課程已開始')` 皆改用 `t()`。
- [x] 4.6 結業作業區塊：按鈕文字「結業」、`toast.error('尚無已核准學員，無法結業')` 改用 `t()`。
- [x] 4.7 重新招募作業區塊：說明文字、按鈕「退回招生中」、確認視窗（標題/說明/取消/確認退回）改用 `t()`。
- [x] 4.8 取消上課作業區塊：按鈕「取消授課」改用 `t()`。
- [x] 4.9 其餘 toast fallback（`handleCancelOrder`／`handleReportPayment`／`handleConfirmReceipt`／`handleReopen`／`handleFinalize`／`handleReopenMaterial` 內的 `result.message ?? '...'`）之 fallback 文字改用 `t()`（`result.message` 本身不變更）；`匯款後五碼`／`回填`／`送出中...`／`取消中...`／`我已收到教材`／`確認中...`／`訂單 #{id}`／`尚未申請教材，請在開始上課前完成申請。`／`教材費用 NT$X，請匯款至：` 等內嵌文字一併改用 `t()`。
- [x] 4.10 明確不處理：`fmt` 函式內 `toLocaleString('zh-TW')` 日期格式化（date-fns/日期在地化為另一項未來變更，本次維持原狀）。

## 5. 刪除死碼

- [x] 5.1 執行 `grep -rn "CourseOrderDialog\|CourseOrderForm\|createCourseOrder\|courseOrderSchema\|CourseOrderFormValues"`，確認除待刪檔案自身外無其他引用。
- [x] 5.2 刪除 `components/course-order/course-order-form.tsx`、`components/course-order/course-order-dialog.tsx`（及目錄，若無其他檔案）。
- [x] 5.3 移除 `app/actions/course-order.ts` 的 `createCourseOrder` 函式與相關未使用 import。
- [x] 5.4 移除 `lib/schemas/course-order.ts` 的 `courseOrderSchema`、`CourseOrderFormValues` 型別。
- [x] 5.5 刪除後重新執行 5.1 的 grep 確認全部清除，並執行 `npm run build` 確認無殘留 import 導致的型別/編譯錯誤。

## 6. i18n 其他語系與規格同步

- [x] 6.1 `messages/en.json` 補譯第 1 節新增的所有 key。
- [x] 6.2 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`。

## 7. 驗證

- [x] 7.1 `npm run lint` 通過。
- [x] 7.2 `npm run build` 通過。
- [x] 7.3 手動測試：切換 zh-TW/en/zh-CN，開啟教材申請對話框（單一地址與多地址模式）走一遍，確認無硬編碼繁體殘留、無裸 i18n key 顯示。
- [x] 7.4 手動測試：切換三語系，檢視課程詳情頁教材申請作業（含已有訂單的內嵌資訊）、開始上課、結業、重新招募、取消上課五個區塊與其確認視窗。
- [x] 7.5 手動測試：教材申請對話框刻意觸發各驗證錯誤（未選取貨方式、未填收件人/電話、多地址未新增地址、單一地址未勾選任何書），確認顯示對應語言之錯誤訊息而非裸 key。
- [x] 7.6 確認死碼刪除後，`/admin` 及課程頁面所有既有功能（教材申請、批價、確認收款、確認寄送等）操作正常，無因誤刪共用程式碼而壞掉的功能。
