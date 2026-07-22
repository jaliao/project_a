## Context

課程網域多語系遷移分批進行（`cr-spec-260629-004/006/007/008`），採 next-intl，訊息以 `messages/zh-TW.json` 為唯一事實來源，`en.json` 人工補譯，`zh-CN.json` 以 `npm run gen:zh-cn`（OpenCC）自動產生，不手改。既有規範（CLAUDE.md 第 12 點）：

- Server 元件用 `getTranslations`，Client 元件用 `useTranslations`；本次兩個目標檔皆為 `'use client'`。
- Zod schema 錯誤訊息一律為 `validation.*` **key**（非文案本身），呈現端以共用元件 `<FieldError message={errors.x?.message} />`（`components/ui/field-error.tsx`，內部 `t(message)`）翻譯呈現；schema key 化採「全有全無」——某 schema key 化後，其所有呈現端須同批改用 `<FieldError>`。
- Server Action 回傳的 `errors`（Record<string,string[]>）為 key，`message`（動作層文案，如「教材申請已送出」）本就非 key、維持原樣——本次**不**變更此行為（proposal 已定案）。

`course-detail-actions.tsx` 其實**已部分 i18n 化**：`course.material` 命名空間已有 `sectionDemand`/`sectionProgress`/`sectionApply`/`applyNotesTitle`/`noteApplyButton` 等 key（供「教材申請作業」區塊使用）。本次剩餘的硬編碼落在：「開始上課作業」「結業作業」「重新招募作業」「取消上課作業」三個區塊、各類確認視窗（開始上課、重新招募）、`DELIVERY_LABELS`/`bookLabel` 標籤字首、與 `MaterialOrderInfo` 內嵌訂單資訊的固定文字。`material-order-dialog.tsx` 則多數尚未遷移（僅 `course.material` 既有 key 如 `versionShortTraditional` 被使用於下拉選單，Dialog 本體其餘文字皆硬編碼）。

`components/course-order/`（`course-order-form.tsx`＋`course-order-dialog.tsx`）與 `app/actions/course-order.ts::createCourseOrder`、`lib/schemas/course-order.ts::courseOrderSchema` 構成一條完整但無路由掛載的死碼路徑（`CourseOrderDialog` 零外部引用）。

## Goals / Non-Goals

**Goals:**
- `material-order-dialog.tsx`、`course-detail-actions.tsx` 剩餘硬編碼繁體文字全數改用既有或新增的 `course.material` 命名空間 key。
- `lib/schemas/course-order.ts` 中仍在使用的 schema（`materialOrderSchema`／`shipmentItemSchema`／`orderBookItemInputSchema`）之錯誤訊息改為 `validation.*` key，兩個目標元件的對應表單欄位同批改用 `<FieldError>`。
- 移除 `components/course-order/` 死碼與 `createCourseOrder`/`courseOrderSchema`。
- `i18n-course` spec 之「課程網域範圍邊界」排除項移除 `components/course-order`。

**Non-Goals:**
- 不處理後台（admin）頁面、信件模板、terms/privacy 長文、date-fns／`toLocaleString` 日期格式化在地化——皆為使用者另列的未來項目。
- 不變更 Server Action 回傳的 `message`（動作層文案）行為。
- 不移除 Prisma `MaterialVersion`/`PurchaseType` enum 或 `CourseOrder` 對應欄位（`applyMaterialOrder` 仍以佔位值寫入這些既有必填欄位；欄位移除屬更大範圍 schema 清理，需另外評估）。
- 不變更 `components/admin/material-order-table.tsx`、出貨單列印頁——這些是後台範圍，明確排除。

## Decisions

### 1. 沿用 `course.material` 命名空間，不開新命名空間
兩個目標檔已使用 `course.material`（`versionShortTraditional`、`sectionDemand` 等），新增 key（如取貨方式標籤、確認視窗文案）比照放入同一命名空間，維持詞彙一致、避免同義 key 分散於多個命名空間。
- 替代方案：為 `material-order-dialog` 另開 `course.materialOrder` 命名空間。評估後認為兩檔共用大量詞彙（取貨方式、書本數量格式），分開命名空間反而增加重複 key 維護成本，故不採用。

### 1a. 非教材相關的區塊/操作文字另開 `course.actions` 命名空間
`course-detail-actions.tsx` 中「開始上課作業」「結業作業」「重新招募作業」「取消上課作業」四個區塊標題與其專屬按鈕/確認視窗文字（非教材需求/進度相關）與 `course.material` 語意不同，另開 `course.actions` 命名空間承接，避免把整個課程操作區塞進單一材料命名空間。

### 2. 取貨方式標籤 key 化為 `course.material.delivery*`
`DELIVERY_OPTIONS`（`material-order-dialog.tsx`）與 `DELIVERY_LABELS`（`course-detail-actions.tsx`）內容相同（7-11／全家／郵寄、宅配），合併為同一組 key（`deliverySevenEleven`／`deliveryFamilyMart`／`deliveryDelivery`），兩檔各自的常數改為呼叫 `t()` 組陣列/物件。
- 替代方案：援引 `i18n-enum-labels` 既有的 `status`/`role`/`catalog` 命名空間模式另建 `delivery` 命名空間。評估後認為取貨方式僅此二檔使用（後台 `material-order-table.tsx`/列印頁不在本次範圍、仍用繁體常數），獨立命名空間效益不明顯，暫沿用 `course.material`，若後續後台批次也要 key 化，屆時可視情況重構為共用命名空間。

### 3. Zod 驗證訊息 key 化範圍限定於現行使用中的 schema
`materialOrderSchema`／`shipmentItemSchema`／`orderBookItemInputSchema` 的 `min()`/`enum()`/`superRefine` 訊息改為 `validation.*` key（比照 `lib/schemas/auth.ts` 既有寫法）；已刪除的 `courseOrderSchema` 不處理。`material-order-dialog.tsx` 內以 `<FormMessage />`（shadcn）呈現錯誤處，改為 `<FieldError message={...} />`。
- 風險：`materialOrderSchema` 為 `discriminatedUnion`／`superRefine` 混合結構，部分錯誤是手動 `ctx.addIssue` 產生——需逐一確認每個 `addIssue` 的 `message` 都改為 key，且維持 `path` 不變（否則欄位對應的錯誤顯示會跑位）。

### 4. 刪除死碼前以 grep 再次確認零引用
執行刪除前重新 `grep -rn "CourseOrderDialog\|CourseOrderForm\|createCourseOrder\|courseOrderSchema"`，確認除待刪檔案自身外無其他引用，才進行刪除，避免誤刪仍被引用的程式碼。

### 5. `i18n-course` spec 同步瘦身排除清單
「課程網域範圍邊界」原排除 `components/course-order` 與 `components/course-invite`；本次刪除前者死碼後，該排除項改為僅 `components/course-invite`（邀請操作，仍不在本次範圍）。

## Risks / Trade-offs

- **[風險] `course-detail-actions.tsx` 已部分 i18n 化，剩餘與既有 key 交錯** → 緩解：實作前逐段核對哪些文字已用 `t()`、哪些仍硬編碼，避免重複定義或遺漏；不重新命名既有已上線 key。
- **[風險] Zod 訊息換成 key 後，若某表單欄位遺漏改用 `<FieldError>`，會直接顯示 key 字串給使用者（如「validation.deliveryMethodRequired」）** → 緩解：schema key 化與呈現端改用 `<FieldError>` 須同批完成（"全有全無"原則），實作後以瀏覽器操作各表單錯誤路徑逐一確認無裸 key 顯示。
- **[風險] 刪除死碼時遺漏引用** → 緩解：見 Decision 4，刪除前後皆執行 grep 驗證；`npm run build` 會因型別/import 錯誤而失敗，作為第二道防線。
- **[取捨] 取貨方式標籤未獨立命名空間** → 若後續後台批次也要 key 化取貨方式標籤，屆時可能需要一次小型重構（移動 key 位置），本次先以低成本方式沿用 `course.material`。

## Migration Plan

1. 於 `messages/zh-TW.json` 新增 `course.material.*` 與 `validation.*` 所需 key。
2. `lib/schemas/course-order.ts`：改 `materialOrderSchema`／`shipmentItemSchema`／`orderBookItemInputSchema` 訊息為 key。
3. `material-order-dialog.tsx`／`course-detail-actions.tsx`：文字改 `t()`、表單錯誤改 `<FieldError>`。
4. Grep 確認零引用後，刪除 `components/course-order/*`、`createCourseOrder`、`courseOrderSchema`。
5. 更新 `openspec/specs/i18n-course/spec.md`「課程網域範圍邊界」排除清單（於 sync 階段處理，非本次程式碼任務）。
6. `messages/en.json` 補譯；`npm run gen:zh-cn` 重新產生 `zh-CN.json`。
7. `npm run lint` + `npm run build`；以瀏覽器切換 zh-TW/en/zh-CN 走一遍教材申請與各操作區塊確認無裸 key、無硬編碼遺漏。

無 DB migration，無需 rollback 特殊處理；如需回退，回退程式碼與訊息檔即可。

## Open Questions

- 取貨方式標籤未來若要推廣到後台（`material-order-table.tsx`/列印頁），是否需要獨立命名空間，留待該批次評估。
