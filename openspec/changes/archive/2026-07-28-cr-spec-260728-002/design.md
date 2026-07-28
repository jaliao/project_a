## Context

`material-order-dialog.tsx` 的收件地址欄位有兩處：單一地址模式（`382-390` 行，`FormField name="deliveryAddress"`，有 `FormLabel`）與多地址模式（`MultiAddressRow` 內 `726-731` 行，`FormField name="shipments.${index}.deliveryAddress"`，無 `FormLabel`、以 `placeholder` 顯示欄位名稱）。兩處目前皆無任何提示/說明文字。`components/ui/form.tsx` 已提供 `FormDescription`（樣式為 `text-muted-foreground text-sm`），但本檔案目前未從 `@/components/ui/form` 匯入。

## Goals / Non-Goals

**Goals:**
- 兩處收件地址欄位下方皆顯示提示文字，告知使用者需填寫完整地址並包含郵遞區號。
- 提示文字走 i18n（`course.material` 命名空間），不寫死中文。

**Non-Goals:**
- 不新增地址格式或郵遞區號驗證邏輯。
- 不調整欄位必填規則或錯誤訊息。
- 不處理個人資料頁的 `User.address` 欄位（不同模型與用途，本次範圍不含）。

## Decisions

- 使用既有的 `FormDescription`（`@/components/ui/form`）呈現提示文字，樣式與專案既有 Form 元件慣例一致，取代手刻 `<p className="text-muted-foreground text-xs">`；需於檔案頂部 import 區塊補上 `FormDescription`。
- i18n key 命名為 `deliveryAddressHint`，沿用 `course.material` 命名空間既有的 `*Hint` 慣例（同檔案內已有 `unassignedHint`、`startGateHint`）。
- 單一地址模式：`FormDescription` 置於 `<FormControl>` 與 `<FieldError>` 之間。
- 多地址模式：因該欄位無 `FormLabel`（以 placeholder 代替標籤），`FormDescription` 同樣置於 `<FormControl>` 與 `<FieldError>` 之間，維持與單一地址模式一致的視覺順序。
- 兩處共用同一個 i18n key（`deliveryAddressHint`），不需為多地址模式另建 key，因文案內容完全相同。

## Risks / Trade-offs

- [風險] 多地址模式每個地址列都會重複顯示同一句提示文字，欄位多時可能顯得重複 → Mitigation：文案本身簡短（一行），且多地址情境本就需要使用者對每個地址分別確認寄送資訊，重複提示可接受，不在本次處理範圍內優化。
