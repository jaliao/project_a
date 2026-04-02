## 1. Zod Schema 精簡

- [x] 1.1 更新 `lib/schemas/course-order.ts` `materialOrderSchema`：移除 `buyerNameZh`、`buyerNameEn`、`teacherName`、`churchOrg`、`email`、`phone`、`courseDate` 必填欄位；更新 `MaterialOrderFormValues` 型別
- [x] 1.2 在 `lib/schemas/course-order.ts` 新增 `adminMaterialOrderEditSchema`：包含所有快照欄位（buyerNameZh/En、teacherName、churchOrg、email、phone、courseDate）+ taxId（選填），供管理者編輯用

## 2. Server Action 更新

- [x] 2.1 更新 `app/actions/course-order.ts` `applyMaterialOrder`：提交前查詢 User（含 church 關聯）與 CourseInvite（含 createdBy），自動組合快照欄位填入 `orderData`
- [x] 2.2 新增 `app/actions/course-order.ts` `updateMaterialOrderAdmin(orderId, data)`：限 admin/superadmin，更新 CourseOrder 的快照欄位與 taxId，成功後 `revalidatePath('/admin/materials')`

## 3. 申請表單精簡

- [x] 3.1 更新 `components/course-session/material-order-dialog.tsx`：移除購買人資料區塊（buyerNameZh/En、teacherName、churchOrg、email、phone）與開課日期欄位；更新 `defaultValues` 與 `prefill` prop 型別
- [x] 3.2 移除 `MaterialOrderDialogProps.prefill` 中不再需要的欄位（buyerNameZh/En、email、phone、courseDate）；確認呼叫端（`app/(user)/course/[id]/page.tsx`）不再傳入這些欄位

## 4. 後台管理頁新增編輯功能

- [x] 4.1 新增 `components/admin/material-order-edit-dialog.tsx`（Client Component）：使用 React Hook Form + `adminMaterialOrderEditSchema`，顯示所有可編輯快照欄位，送出呼叫 `updateMaterialOrderAdmin`
- [x] 4.2 更新 `components/admin/material-order-table.tsx`：在展開詳情區塊補顯快照欄位（buyerNameZh/En、teacherName、churchOrg、email、phone、courseDate）；新增「編輯」按鈕開啟 `MaterialOrderEditDialog`

## 5. 版本與文件

- [x] 5.1 `config/version.json` patch 版本號 +1
- [x] 5.2 依 `.ai-rules.md` 更新 `README-AI.md`
