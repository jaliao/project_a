## Why

課程一旦被取消（`CourseInvite.cancelledAt` 設定），課程詳情頁的整個「教材申請作業」區塊（含既有的「取消申請」按鈕）會因為元件層級的 `if (isCancelled) return null` 而完全隱藏。這使得課程取消前已建立、尚未回填匯款的教材申請訂單，從此無法再被取消／刪除，只能卡在資料庫中，講師與管理者皆束手無策。

## What Changes

- 課程已取消時，講師與管理者課程詳情頁 SHALL 顯示「教材申請作業」區塊的**精簡版**：僅列出既有教材訂單清單與各筆狀態，尚未回填匯款者顯示「取消申請」按鈕（沿用既有 `cancelCourseOrder` action，邏輯不變）。
- 已取消課程 SHALL NOT 顯示「申請教材」（新增訂單）、「已完成申請」／「重新開放申請」等與未取消課程相關的操作，避免對已取消課程繼續申請或管理教材流程。
- 「取消申請」的既有限制維持不變：僅「尚未回填匯款」（`paymentReportedAt` 為 null）的訂單可被取消；已回填匯款／已審核／已寄送的訂單本次不放寬，管理者仍需另行歸檔處理。
- 後台教材管理頁（`/admin/materials`）SHALL 顯示所屬課程已取消之標記，尚未回填匯款者 SHALL 提供「取消申請」按鈕，供管理者不進入課程頁即可直接清理，與講師課程頁共用同一 `cancelCourseOrder` action。
- 不進行資料清理（使用者已確認的兩筆現有卡住訂單，待本功能完成後由使用者自行透過新入口處理，不在本次自動處理）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `material-order-cancel`：新增「已取消課程仍可取消尚未付款之教材訂單」需求（講師課程頁精簡版＋後台教材管理頁皆可操作），明確課程取消不影響既有「取消申請」的可執行性

## Impact

- `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：調整「教材申請作業」區塊的顯示條件（自 `!isStarted && canManageMaterials` 擴充為已取消時亦顯示），並依 `isCancelled` 分支渲染精簡版（僅訂單清單＋取消按鈕）或原有完整版（需求統計／進度／申請作業）。
- `lib/data/course-order.ts`：`getAllCourseOrdersWithInvite` 新增查詢並回傳 `inviteCancelledAt`，供後台表格判斷課程是否已取消。
- `components/admin/material-order-table.tsx`：課程欄位旁顯示「已取消」標記；尚未回填匯款之訂單新增「取消申請」按鈕，呼叫既有 `cancelCourseOrder`。
- `app/actions/course-order.ts` 的 `cancelCourseOrder`：`revalidatePath` 新增 `/admin/materials`，確保後台表格取消後即時更新；權限與付款階段守衛皆不變。
- 無資料庫 schema 變更，無 migration。
