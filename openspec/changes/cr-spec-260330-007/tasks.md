## 1. DB Schema 更新

- [x] 1.1 `prisma/schema/course-order.prisma` 新增 `deliveryAddress String?` 欄位
- [x] 1.2 執行 `make schema-update name=add_course_order_delivery_address`

## 2. Data Layer

- [x] 2.1 新增 `getEnrollmentMaterialSummary(inviteId: number)` 函數於 `lib/data/course-sessions.ts`，查詢 approved 學員的 materialChoice 統計，回傳 `{ traditional: number, simplified: number }`
- [x] 2.2 更新 `lib/data/course-order.ts`（或相關 data layer），補充出貨單頁面所需查詢（含 courseInvites 關聯以取得課程名稱）

## 3. Server Action 更新

- [x] 3.1 更新 `applyMaterialOrder` action：移除 materialVersion/purchaseType/studentNames/quantity/quantityNote 欄位的存取與驗證；新增 deliveryAddress 欄位

## 4. 教材申請表單 UI 更新

- [x] 4.1 找到教材申請 Dialog/Form 元件，移除書籍相關欄位（materialVersion、purchaseType、studentNames、quantity、quantityNote）
- [x] 4.2 新增 `deliveryAddress` 輸入欄位，label 依 `deliveryMethod` 動態切換：7-11/全家 → 「門市店號 / 門市名稱」；宅配 → 「收件地址」
- [x] 4.3 更新 Zod schema，新增 materialOrderSchema（移除書籍欄位，新增 deliveryAddress）

## 5. 出貨單列印頁面

- [x] 5.1 新建 `app/(user)/admin/materials/[id]/print/page.tsx`（Server Component，管理者限定）
- [x] 5.2 頁面顯示：申請編號、課程名稱、收件者姓名、寄件方式、地址（label 依 deliveryMethod 切換）、書本統計（繁體 N 本 / 簡體 N 本）
- [x] 5.3 頁面加入「列印」按鈕（print-button.tsx Client Component）與 print:hidden CSS 隱藏控制列

## 6. 後台管理頁更新

- [x] 6.1 `components/admin/material-order-table.tsx` 每筆申請新增「列印出貨單」按鈕，連結至 `/admin/materials/[id]/print`（新分頁）

## 7. 驗證與收尾

- [x] 7.1 確認教材申請表單送出正常（不含已移除欄位）
- [x] 7.2 確認出貨單頁面書本數量正確反映已核准學員的 materialChoice 統計
- [x] 7.3 確認地址欄 label 隨取貨方式動態切換（7-11/全家 → 門市店號；宅配 → 收件地址）
- [x] 7.4 版本號 patch +1（config/version.json）
- [x] 7.5 更新 README-AI.md
