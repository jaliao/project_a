## 1. 資料層修正

- [x] 1.1 在 `lib/data/course-order.ts` 的 `getCourseOrderForPrint` select 補上 `storeId: true`、`storeName: true`
- [x] 1.2 更新 `CourseOrderForPrint` 型別定義，新增 `storeId: string | null`、`storeName: string | null`

## 2. 出貨單列印頁 UI 修正

- [x] 2.1 在 `app/(user)/admin/materials/[id]/print/page.tsx` 收件資訊區塊，依 `deliveryMethod` 條件渲染：超商取貨顯示門市名稱（`storeName`）與門市店號（`storeId`）兩列；郵寄顯示收件地址（`deliveryAddress`）一列
- [x] 2.2 移除不再需要的 `getAddressLabel` 輔助函式

## 3. Server Action 修正

- [x] 3.1 在 `app/actions/course-order.ts` 的 `applyMaterialOrder` 修正 `storeId`/`storeName` 條件：原本只在 `sevenEleven` 時儲存，改為 `sevenEleven || familyMart` 均儲存；`deliveryAddress` 條件改為只在 `delivery` 時儲存（原本錯誤地在 `familyMart` 時也儲存）

## 4. 版本與文件更新

- [x] 4.1 將 `config/version.json` patch 版本號 +1
- [x] 4.2 更新 `README-AI.md` 版本號
