## 1. 移除元件層級早退，逐區塊補上 `!isCancelled` 排除

- [x] 1.1 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx` 移除 `if (isCancelled) return null`
- [x] 1.2 「開始上課作業」區塊條件由 `!isStarted && isInstructor` 改為 `!isStarted && !isCancelled && isInstructor`
- [x] 1.3 「結業作業」區塊條件由 `isStarted && !isCompleted` 改為 `isStarted && !isCompleted && !isCancelled`
- [x] 1.4 「重新招募作業」區塊條件由 `isStarted && !isCompleted` 改為 `isStarted && !isCompleted && !isCancelled`
- [x] 1.5 「取消上課作業」區塊條件由 `!isCompleted` 改為 `!isCompleted && !isCancelled`
- [x] 1.6 「結業回退作業」區塊條件維持 `isCompleted` 不變（`isCompleted`／`isCancelled` 現行流程互斥，不強制加）

## 2. 教材申請作業區塊：新增已取消精簡版

- [x] 2.1 區塊外層顯示條件由 `!isStarted && canManageMaterials` 改為 `(isCancelled || !isStarted) && canManageMaterials`
- [x] 2.2 區塊內以 `!isCancelled &&` 包裹單元一（學員教材需求統計）、單元二的已申請/尚未申請統計列、付款回填卡片（`pending_payment`）、已寄送確認收貨按鈕、單元三（申請教材／已完成申請／重新開放申請）；訂單清單本身兩種模式皆顯示
- [x] 2.3 **實作時發現並修正設計遺漏**：取消申請按鈕原條件為 `canAct`（`= !isCancelled && !isCompleted`），課程已取消時恆為 false，會讓精簡版永遠無法顯示取消按鈕；已改為 `!isCompleted`（不排除 isCancelled），使已取消課程之未付款訂單可正確顯示取消按鈕

## 3. 後台教材管理頁：新增已取消課程標記與取消入口

- [x] 3.1 `lib/data/course-order.ts` 的 `getAllCourseOrdersWithInvite`：`courseInvite.select` 補上 `cancelledAt: true`；`CourseOrderWithInvite` 型別新增 `inviteCancelledAt: Date | null`；mapped 物件補上 `inviteCancelledAt: invite?.cancelledAt ?? null`
- [x] 3.2 `components/admin/material-order-table.tsx`：課程欄位（`order.inviteTitle` 旁）於 `order.inviteCancelledAt` 非 null 時顯示紅色「已取消」badge
- [x] 3.3 `components/admin/material-order-table.tsx`：動作欄於 `order.inviteCancelledAt` 非 null 且 `order.paymentReportedAt` 為 null 時（`pending_quote`／`pending_payment` 狀態），新增「取消申請」按鈕（`window.confirm` 二次確認，比照課程頁 `handleCancelOrder` 模式），呼叫既有 `cancelCourseOrder(order.id)`
- [x] 3.4 `app/actions/course-order.ts` 的 `cancelCourseOrder`：`revalidatePath` 新增 `revalidatePath('/admin/materials')`

**額外清理**：`course-detail-actions.tsx` 的 `canAct` 變數因本次改動後不再被任何地方使用（原本兩處用法皆已改為更精確的條件），已一併移除避免死碼。

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 4.2 已取消課程（尚未回填匯款訂單）：確認課程頁教材申請作業精簡版顯示、訂單清單與取消按鈕正確渲染，點擊取消後訂單被刪除（實測課程 #349，Order #6 建立→課程取消→精簡版正確顯示→取消按鈕成功刪除訂單）
- [x] 4.3 已取消課程（已回填匯款訂單）：確認課程頁該訂單不顯示取消按鈕（實測課程 #348，Order #2 已收件狀態，取消後不顯示任何動作按鈕）
- [x] 4.4 已取消課程：確認課程頁不顯示「申請教材」「已完成申請」「重新開放申請」按鈕（課程 #349 實測確認）
- [x] 4.5 已取消課程：確認課程頁「開始上課」「結業」「重新招募」「取消上課」四區塊皆不顯示（課程 #349 實測，僅顯示 Material Ordering 精簡版）
- [x] 4.6 未取消課程：確認課程頁教材申請作業（含完整三單元）、開始上課、結業、重新招募、取消上課等既有行為皆未受影響（迴歸測試：課程 #347 未開課狀態、課程 #350 已開課狀態，兩種組合皆與預期一致）
- [x] 4.7 後台教材管理頁：已取消課程的訂單顯示「已取消」badge；尚未回填匯款者顯示「取消申請」按鈕，點擊確認後訂單被刪除、表格即時更新（實測 Order #7，共 4 筆→3 筆）
- [x] 4.8 後台教材管理頁：已回填匯款之已取消課程訂單，確認不顯示「取消申請」按鈕（Order #2）；未取消課程的訂單維持原有動作欄行為，無「已取消」badge、無取消按鈕（Order #1、#5）
