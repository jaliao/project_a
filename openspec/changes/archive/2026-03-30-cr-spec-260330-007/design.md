## Context

教材申請現有流程：
1. 學員報名時選擇 `InviteEnrollment.materialChoice`（none/traditional/simplified）
2. 講師另外填寫 `CourseOrder`（包含 materialVersion/purchaseType/quantity 等書籍欄位）→ 資料重複
3. 後台 `/admin/materials` 顯示申請列表，僅支援「確認已寄送」操作，無出貨單列印

**出貨單所需資訊**：
- 編號：`CourseOrder.id`
- 收件者：`CourseOrder.buyerNameZh`
- 寄件方式：`CourseOrder.deliveryMethod`（sevenEleven/familyMart/delivery）
- 地址：`CourseOrder.deliveryAddress`（**新增欄位**）
- 書本內容與數量：從 `InviteEnrollment.materialChoice` 統計（**改為自動計算**）

## Goals / Non-Goals

**Goals:**
- 新增 `CourseOrder.deliveryAddress` 欄位（migration）
- 地址欄位依 `deliveryMethod` 動態顯示 label：便利商店 → 「門市店號/名稱」；宅配 → 「收件地址」
- 從 `InviteEnrollment.materialChoice` 統計書本數量（approved 學員）
- 後台管理頁新增出貨單列印（瀏覽器 `window.print()`，不依賴外部套件）
- 移除 CourseOrder 表單書籍欄位（materialVersion/purchaseType/studentNames/quantity/quantityNote）

**Non-Goals:**
- 不實作 PDF 產生（使用瀏覽器列印即可）
- 不刪除 DB 舊欄位（本次 migration 僅新增 deliveryAddress，舊欄位標記廢棄留待後續清理）
- 不修改學員端書籍選擇流程

## Decisions

**1. 地址欄位：單一 `deliveryAddress String?` 欄位，label 動態切換**

依 `deliveryMethod` 顯示不同 label：
- `sevenEleven` / `familyMart` → label: 「門市店號 / 門市名稱」
- `delivery` → label: 「收件地址」

替代方案（兩個分開欄位 storeNo / address）→ 棄用，一個 String 欄位搭配 label 足夠，不需要資料庫層區分。

**2. 書本數量統計：data layer 函數，查詢時計算**

新增 `getEnrollmentMaterialSummary(inviteId)` 回傳：
```ts
{ traditional: number, simplified: number }
```
查詢條件：`status = approved` 且 `materialChoice != none`

替代方案（DB 預先彙整欄位）→ 棄用，統計邏輯簡單，不需要冗餘欄位。

**3. 出貨單列印：獨立列印頁 `/admin/materials/[id]/print`**

Server Component 頁面，完整呈現出貨單內容，搭配 `@media print` CSS 隱藏非必要元素，透過 `window.print()` 觸發。

替代方案（Modal 內列印）→ 棄用，獨立頁面 URL 可直接分享、更易控制列印樣式。

**4. 廢棄欄位處理：保留 DB 欄位，僅移除表單 UI**

本次不執行 migration 刪除 materialVersion/purchaseType/studentNames/quantity/quantityNote，避免影響既有資料。欄位標記廢棄，表單 UI 移除，後續視清理需求另立 change。

## Risks / Trade-offs

- **風險**：舊資料 deliveryAddress 為 null（migration 前的申請）→ 出貨單顯示「（未填）」，不影響新申請
- **風險**：便利商店店號格式不統一 → 本次不做格式驗證，純文字欄位由講師自行填寫
- **Trade-off**：保留舊 DB 欄位造成 schema 冗餘，但避免 migration 刪除欄位風險

## Migration Plan

1. `make schema-update name=add_course_order_delivery_address`
2. 確認 migration 成功後部署前端變更
3. 舊資料 `deliveryAddress = null` 可接受

## Open Questions

- 出貨單是否需要顯示課程名稱？（目前 CourseOrder 透過 CourseInvite 關聯）→ 建議顯示，從 `courseInvites[0].title` 取得
