# Design: cr-spec-260706-001 多地址切換回單一地址後無法送出（驗證修正）

## Context

教材申請表單（`components/course-session/material-order-dialog.tsx`）支援 `single`／`multiple` 兩種寄送模式，共用 `materialOrderSchema`（`lib/schemas/course-order.ts`），客戶端（react-hook-form + zodResolver）與 Server Action（`app/actions/course-order.ts`）皆以此 schema 驗證。

現況問題：`shipments: z.array(shipmentItemSchema).optional()` 屬於 zod 基底 object 驗證，只要陣列非空就會逐項執行 `shipmentItemSchema` 的必填檢查（收件人、電話、門市/地址、`enrollmentIds.min(1)`），**不受** `superRefine` 內 `shipMode` 分流控制。而表單切換模式只改 `shipMode` 值，`useFieldArray` 已建立的地址列仍留在表單 state。因此「切到 multiple 加了未填完的列 → 切回 single」後，送出被隱藏欄位的驗證錯誤卡住，且錯誤 UI 已隱藏、使用者無從得知。

Server Action 的 single 分支（`course-order.ts:246`）本來就不讀取 `d.shipments`，資料寫入無誤——問題純在驗證層。

## Goals / Non-Goals

**Goals:**
- `shipMode === 'single'` 時，`shipments` 殘留內容完全不參與驗證、不阻擋送出
- `shipMode === 'multiple'` 時，逐項驗證行為與現行完全相同（訊息、path 不變，錯誤仍正確顯示在對應列）
- 模式來回切換不遺失使用者已填的多地址列資料
- 客戶端與伺服器端共用同一份修正後 schema（行為一致）

**Non-Goals:**
- 不改多地址功能本身的流程與資料模型（`MaterialShipment` 不動）
- 不做本 schema 的 i18n validation key 遷移（依漸進遷移「全有全無」原則，本次維持既有繁體訊息）
- 不改 DB schema、不改 API 介面

## Decisions

### D1：在 schema 層以 shipMode 分流逐項驗證（而非表單層清空資料）

**做法**：將 `materialOrderSchema` 內的 `shipments` 改用「寬鬆版」項目 schema（欄位形狀相同、但無必填/min 限制），把逐項嚴格驗證移入 `superRefine` 的 `shipMode === 'multiple'` 分支：對每列以 `shipmentItemSchema.safeParse()` 驗證，並將 issues 以 `path: ['shipments', i, ...issue.path]` 轉發，維持既有錯誤訊息與欄位定位。

**替代方案（否決）**：
- **表單切回 single 時清空 `shipments`（`replace([])`）**：使用者誤切模式即遺失已填資料，UX 差；且僅修客戶端，若 payload 仍帶殘留列，Server Action 端同一 schema 依然驗證失敗，等於要修兩處。
- **`z.discriminatedUnion` 依 shipMode 拆成兩個 schema**：型別最嚴謹，但 `MaterialOrderFormValues` 推導型別會變成 union，`useForm`／`useFieldArray` 泛型與現有元件程式碼需大幅改動，對一個驗證修正而言成本不成比例。

**型別相容性**：寬鬆版項目 schema 欄位形狀與 `shipmentItemSchema` 一致（僅去除 `.min(1)` 與 superRefine），`z.infer` 推導型別不變，表單元件與 Server Action 均不需改型別。

### D2：`shipmentItemSchema` 保留原樣並繼續匯出

嚴格版 `shipmentItemSchema` 仍是多地址列驗證的單一事實來源（superRefine 分支引用它逐列 safeParse），`ShipmentItemValues` 型別匯出不變。

### D3：表單元件不清空、不額外處理

切換模式不清空 `shipments`（保留資料，切回 multiple 不遺失）；single 送出時 payload 可帶殘留列，Server Action single 分支既有行為即忽略之（不寫入任何寄送批次）。元件端預期**零修改**，僅需實測確認。

## Risks / Trade-offs

- [殘留列隨 payload 送到伺服器] → Server Action single 分支不讀 `shipments`（現況已如此），實作時以測試/實測確認不會誤建 `MaterialShipment`。
- [superRefine 轉發 issues 時 path 組錯] → 錯誤會顯示不到對應列。以「multiple 模式下缺欄位送出」實測每個欄位（收件人/電話/門市/地址/指派）錯誤仍逐列正確顯示。
- [寬鬆版與嚴格版 schema 欄位日後不同步] → 兩者同檔相鄰定義並加註釋說明對應關係；嚴格版仍為單一事實來源。

## Migration Plan

無資料遷移（純驗證邏輯修正、系統未上線）。部署即生效；回滾即還原程式碼。

## Open Questions

（無）
