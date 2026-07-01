## Context

- 後台 `material-order-table.tsx`：`OrderDetail` 有「編輯」按鈕（`onEditClick` → `MaterialOrderEditDialog`，`editOrderId` state）。
- 前台 `course-detail-actions.tsx`：訂單列有「查看教材申請」按鈕（`openViewOrder` → 唯讀 `MaterialOrderDialog`，`dialogOrder` state）；`待付款` 顯示匯款回填輸入。`CourseSessionOrder` 已含 recipientName/Phone、deliveryMethod/Address/store、繁簡數量、shippedAt/receivedAt、quotedAmount、paymentReportedAt 等。
- 訂單狀態：`getMaterialOrderStatus`（pending_quote/pending_payment/pending_confirm/pending_ship/shipped/received）。
- `CourseOrder` 無 `cancelledAt`；`MaterialShipment`/`MaterialShipmentItem` 對訂單為 cascade delete。

## Goals / Non-Goals

**Goals:**
- 後台移除編輯訂單。
- 前台以內嵌方式顯示各訂單資訊（取代查看對話框）。
- 老師回填匯款前可取消訂單（刪除、釋放書本、可重申請）。

**Non-Goals:**
- 不改金流狀態機其餘部分；不改多地址寄送/確認邏輯。
- 無 migration。

## Decisions

1. **後台移除編輯**：`material-order-table.tsx` 移除 `OrderDetail` 的編輯按鈕、`onEditClick` prop、`editOrderId`/`editingOrder` state、`MaterialOrderEditDialog` 渲染與 import。刪除 `components/admin/material-order-edit-dialog.tsx`（及 `app/actions/course-order.ts` 內僅供其用的 `updateMaterialOrderAdmin`／`adminMaterialOrderEditSchema` 若無他用則移除）。
2. **前台內嵌顯示**：`course-detail-actions.tsx` 訂單列移除「查看教材申請」按鈕、`openViewOrder`、`dialogOrder` state 與唯讀 `MaterialOrderDialog`（保留新申請：`openNewOrder` 仍以 `existingOrder=null` 開 dialog）。改在每筆訂單列內嵌顯示：書本數量（繁/簡）、取貨方式（郵寄/宅配→地址；超商→門市（店號））、收件人＋電話、寄送時間、收件時間；`shipMode='multiple'` 則逐地址列出（含各地址書本項目學員名）。
3. **取消訂單**：`app/actions/course-order.ts` 新增 `cancelCourseOrder(orderId)`：驗證登入；查訂單＋其 `courseInvite.createdById` 須為操作者（擁有者）；`paymentReportedAt` 須為 null（未回填匯款），否則拒絕；`prisma.courseOrder.delete`（cascade 刪 shipments/items → 書本回未指派）；`revalidatePath('/course/{inviteId}')`。前台於 `status.key ∈ {pending_quote, pending_payment}` 顯示「取消申請」按鈕（含確認），成功後 `router.refresh()`。
4. 內嵌資訊樣式沿用既有 `text-sm` 欄位列，與後台 `OrderDetail` 呈現一致。

## Risks / Trade-offs

- 刪除訂單為不可復原：以「僅未回填匯款可取消」＋前端確認降低誤刪；系統未上線風險低。
- `MaterialOrderDialog` 移除 view 後 `existingOrder` 唯讀分支變 dead（保留不影響；如要精簡可另清）。
- 移除 `updateMaterialOrderAdmin` 前需確認無其他呼叫端。
- 無 migration。
