## Why

多語系遷移前幾批（`cr-spec-260629-004/006/007/008`）已將課程網域大部分 UI 遷移為 i18n，但 `material-order-dialog.tsx`（教材申請對話框）與 `course-detail-actions.tsx`（課程頁教材/付款/開課操作區）因「教材/付款耦合」複雜度較高，被明確延後、標記為後續項目「009」（見 `cr-spec-260629-008` tasks.md 3.4）。這兩個檔案是課程網域目前僅存、規模最大的硬編碼繁體中文區塊，`i18n-course` spec 也已宣稱涵蓋（`components/course-session`、`course/[id]` 詳情）但實作尚未完成。此外，`components/course-order/`（`course-order-form.tsx`／`course-order-dialog.tsx`／`createCourseOrder`／`courseOrderSchema`）已確認是死碼——`CourseOrderDialog` 從未被任何頁面掛載——與其花力氣在地化不如直接移除，避免遷移到用不到的程式碼上。

## What Changes

- `components/course-session/material-order-dialog.tsx`：約 11 處硬編碼中文（Dialog 標題、取貨方式標籤、欄位標籤、按鈕文字）改為透過 `course.material` 命名空間 `useTranslations` 取用，缺 key 依現行慣例回退繁體。
- `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：約 28 處硬編碼中文（三區塊標題、教材需求統計/進度、確認視窗文案、按鈕、toast 預設文字）改為 i18n key。
- `lib/schemas/course-order.ts`：`materialOrderSchema`／`shipmentItemSchema`／`orderBookItemInputSchema` 的 Zod 驗證訊息（如「請選擇取貨方式」「請填寫收件人」）改為 `validation.*` key，比照專案既有規範透過 `<FieldError>` 呈現；**不**變更 `app/actions/course-order.ts` 各 Server Action 回傳的 `message`（動作層文案，依 CLAUDE.md 既有慣例本就非 key、維持原樣，僅 `errors` 欄位走 key 化）。
- **BREAKING（內部）**：移除死碼 `components/course-order/course-order-form.tsx`、`components/course-order/course-order-dialog.tsx`、`app/actions/course-order.ts` 的 `createCourseOrder`、`lib/schemas/course-order.ts` 的 `courseOrderSchema`/`CourseOrderFormValues`。確認移除前再次驗證無任何路由掛載 `CourseOrderDialog`。**不**移除 Prisma `MaterialVersion`/`PurchaseType` enum 與 `CourseOrder` 對應欄位——`applyMaterialOrder`（現行教材申請流程）仍以佔位值寫入這些既有必填欄位，欄位本身的移除屬更大範圍的 schema 清理，不在本次範圍。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `i18n-course`：「課程元件在地化」實際完成 `material-order-dialog.tsx` 的在地化（原本宣稱涵蓋但未實作）；「課程網域範圍邊界」排除項移除「`components/course-order`（教材訂購）」（死碼已刪除，無需在地化），僅保留 `components/course-invite` 排除。
- `i18n-validation-messages`：適用範圍新增 `materialOrderSchema`／`shipmentItemSchema`／`orderBookItemInputSchema`（原僅 `auth`、`profile`）。

## Impact

- **UI**：`components/course-session/material-order-dialog.tsx`、`app/[locale]/(user)/course/[id]/course-detail-actions.tsx`。
- **驗證**：`lib/schemas/course-order.ts`（validation key 化，範圍限 `materialOrderSchema` 系列，不含已刪除的 `courseOrderSchema`）。
- **i18n 訊息檔**：`messages/zh-TW.json`（`course.material`／`validation` 命名空間新增 key）、`messages/en.json` 同步補譯、`messages/zh-CN.json` 以 `npm run gen:zh-cn` 重新產生。
- **刪除**：`components/course-order/course-order-form.tsx`、`components/course-order/course-order-dialog.tsx`、`app/actions/course-order.ts::createCourseOrder`、`lib/schemas/course-order.ts::courseOrderSchema`/`CourseOrderFormValues`。
- **不影響**：Prisma schema／migration（無 DB 變更）、`app/actions/course-order.ts` 其餘 Server Action 的 `message` 文案、後台（admin）頁面、信件、terms/privacy、date-fns 日期格式化——這些皆為使用者另列的未來項目，不在本次範圍。
