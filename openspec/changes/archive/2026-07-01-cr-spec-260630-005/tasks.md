## 1. 後台移除編輯

- [x] 1.1 `material-order-table.tsx`：移除編輯按鈕、`onEditClick`、`editOrderId`/`editingOrder`、`MaterialOrderEditDialog` 與 `IconEdit` import
- [x] 1.2 刪除 `components/admin/material-order-edit-dialog.tsx`
- [x] 1.3 移除 `updateMaterialOrderAdmin`（course-order.ts）＋ `adminMaterialOrderEditSchema`（schemas/course-order.ts）及其 import

## 2. 取消訂單 Server Action

- [x] 2.1 `cancelCourseOrder(orderId)`：驗證登入＋擁有者（`courseInvite.createdById`）＋`paymentReportedAt` 為 null；`courseOrder.delete`（cascade）；revalidate；ActionResponse

## 3. 前台內嵌顯示＋取消

- [x] 3.1 `course-detail-actions.tsx`：`MaterialOrderInfo` 內嵌顯示（書本數量、取貨方式、收件人·電話、寄送/收件時間；多地址逐地址含學員書本）；`CourseSessionOrder.shipments` 補 `items`（course-sessions.ts）
- [x] 3.2 移除「查看教材申請」按鈕、`openViewOrder`、`dialogOrder`；唯讀 dialog `existingOrder={null}`（保留新申請）
- [x] 3.3 `pending_quote/pending_payment` 顯示「取消申請」→ `cancelCourseOrder` ＋確認 ＋`router.refresh()`／toast

## 4. 文件與版本

- [x] 4.1 管理者手冊（不提供編輯）、老師手冊（內嵌顯示＋匯款前可取消重申請）；版本 v0.1.115
- [x] 4.2 `config/version.json` → 0.1.115；README-AI 同步

## 5. 驗證

- [x] 5.1 `npm run build`（✓ Compiled）、`npm run lint`（0 errors）通過
- [x] 5.2 （執行階段）後台詳情無編輯；前台訂單內嵌顯示各欄位；待批價/待付款可取消→書本釋放→可重申請；已回填匯款無取消
