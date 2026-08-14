## Why

來源：`doc/啟動事工系統問題管理 的副本.pdf`（8/7 小鳥 review）。這是一批針對「申請教材」彈窗（`components/course-session/material-order-dialog.tsx`）與課程管理頁教材申請進度區塊的 UI 文案調整，共 7 項：統一術語（書本→教材）、標題加註寄送限制、簡化清單標題與 placeholder、按鈕改名、刪除兩句已不需要的提示句。其中「加購書名 placeholder 簡化為必填」不只是文案調整，同時牽動 `lib/schemas/course-order.ts` 的驗證規則與 `app/actions/course-order.ts` 既有「未填預設為『額外加購』」的後端 fallback 邏輯，一併納入本次變更範圍。

## What Changes

1. **「書本」統一改稱「教材」**（僅限申請教材彈窗內的 i18n 文案，及緊密引用彈窗清單標題用語的「申請注意事項」提示；不含後台教材管理頁／出貨單列印頁，見下方 Impact 範圍說明）：`listTitle`（併入第 3 項最終文案）、`noStudentBooks`、`multiSummary`、`assignTitle`、`noteApplyButton`。
2. **「寄送方式 \*」標題加註「（僅寄送台灣地址）」**：`shipModeLabel` 純文字加註，不新增地址格式驗證。
3. **「書本清單（依學員申請帶入，可調整）」簡化為「教材清單」**：`listTitle`。
4. **書名輸入框 placeholder 簡化為「教材姓名」、去除括號註明、改為必填**：`extraNamePlaceholder` 文案調整；`lib/schemas/course-order.ts` 的加購項目 `bookName` 由 `z.string().optional()` 改為 `z.string().trim().min(1, 'validation.bookNameRequired')`；移除 `app/actions/course-order.ts` 內「未填時預設為『額外加購』」的 fallback（`input.bookName?.trim() || '額外加購'` → 直接使用已通過驗證、保證非空的 `input.bookName`）；`ExtraItemRow` 新增 inline 錯誤訊息顯示（比照既有欄位以 `FieldError` 呈現）。
5. **「+ 加購一本」按鈕改名為「KUA窗口訂購」**：`addExtra`，彈窗內兩處出現處（單一地址、多地址指派）共用同一 i18n key，一次修改即同步。
6. **刪除「未指派的書本＝本次不申請，可留待日後再申請」提示句**：移除多地址模式下的 `unassignedHint` 顯示與 i18n key。
7. **課程管理頁「教材申請進度」相關區塊，刪除「尚無已核准學員的選書需求，仍可加購申請。」提示句**：移除 `course-detail-actions.tsx`「申請作業」單元中的 `noDemandHint` `<li>` 與 i18n key（`allAppliedHint` 不受影響，保留）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `material-book-items`：加購書本項目的書名不再有「未填預設為額外加購」的行為，改為必填自訂輸入

## Impact

- **修改**：
  - `messages/zh-TW.json`／`messages/en.json`（`course.material` 命名空間：`listTitle`／`noStudentBooks`／`addExtra`／`extraNamePlaceholder`／`multiSummary`／`assignTitle`／`shipModeLabel`／`noteApplyButton` 文案調整；移除 `unassignedHint`／`noDemandHint`；`validation` 命名空間新增 `bookNameRequired`），`messages/zh-CN.json` 以 `npm run gen:zh-cn` 重新產生。
  - `lib/schemas/course-order.ts`：`orderBookItemInputSchema` 的 `extra` 分支 `bookName` 改為必填（trim + min(1)）。
  - `app/actions/course-order.ts`：`resolveItems` 移除「未填預設為『額外加購』」的 fallback。
  - `components/course-session/material-order-dialog.tsx`：移除多地址模式的 `unassignedHint` 提示句；`ExtraItemRow` 新增 `errorMessage` prop 並在 `SingleBookList`／`BookAssignList` 兩處呼叫端算出對應巢狀路徑（`items[idx].bookName` / `shipments[index].items[idx].bookName`）的表單錯誤訊息傳入。
  - `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：移除「申請作業」單元中 `noDemandHint` 的 `<li>`。
- **範圍排除**：`components/admin/material-order-table.tsx`（後台教材訂單列表）與 `app/[locale]/(admin)/admin/materials/[id]/print/page.tsx`（出貨單列印頁）現有「書本」相關硬編碼繁體文案不在本次調整範圍內——CR 明確定位為「申請教材彈窗」文案調整（第 7 項為唯一例外，已另外列出其具體位置），後台頁面沿用專案既有「後台文案維持繁體硬編碼、暫不 i18n」慣例，未被 8/7 review 提及。
- **不修改**：資料模型（`prisma/schema/course-invite.prisma` 等）、既有訂單的歷史快照資料（既有訂單若曾以「額外加購」為書名快照，維持不變，不做資料回溯修改）、`material-multi-address-shipping`／`course-multi-material-order` 等其他 capability 的既有行為。
