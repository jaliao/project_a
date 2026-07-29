## Context

`course-detail-actions.tsx` 目前有一個元件層級的早退：`if (isCancelled) return null`（第 340 行，`canAct = !isCancelled && !isCompleted`），課程一旦取消就完全不渲染任何區塊，包含「教材申請作業」內既有的「取消申請」按鈕（`cancelCourseOrder`，`app/actions/course-order.ts`，僅檢查 `paymentReportedAt`，未檢查課程是否取消，本身邏輯完全正常）。這與 `cr-spec-260728-006`（結業回退作業）修正 `isCompleted` 情境時遇到的問題同構——當時已將早退條件收斂為僅 `isCancelled` 時早退，並為「結業作業」「重新招募作業」「取消上課作業」三區塊個別補上 `!isCompleted` 排除。本次需要再往前一步：連 `isCancelled` 也不能整體早退，因為「教材申請作業」在課程取消時仍需以精簡版呈現。

**額外發現**：`graduateCourse`（`app/actions/course-invite.ts:419`）目前只檢查 `invite.completedAt`，**未檢查 `invite.cancelledAt`**。目前之所以安全，是因為 UI 的 `if (isCancelled) return null` 連帶隱藏了「結業作業」按鈕。若本次移除該早退卻不individually 排除，會讓已取消課程重新露出「結業」按鈕，點擊後 server action 會成功執行（因其本身未擋 cancelledAt），造成已取消課程被結業的資料不一致。因此每個既有區塊都必須明確加上 `!isCancelled` 排除，而非僅移除早退了事。

## Goals / Non-Goals

**Goals:**
- 已取消課程的「教材申請作業」區塊以精簡版顯示：僅訂單清單＋（尚未回填匯款者）取消申請按鈕。
- 已取消課程 SHALL NOT 顯示「申請教材」「已完成申請」「重新開放申請」等新增/管理教材流程的操作。
- 其餘既有區塊（開始上課、結業作業、重新招募作業、結業回退作業、取消上課作業）在課程已取消時的「不顯示」行為維持不變（目前由早退間接達成，改為逐區塊顯式排除）。

**Non-Goals:**
- 不修改 `cancelCourseOrder` 的付款階段限制（維持僅未回填匯款可取消）。
- 不處理已知的 2 筆卡住訂單資料（使用者已確認待功能完成後自行處理）。
- 不追加 `cancelledAt` 檢查到 `graduateCourse`（超出本次範圍；本次僅透過 UI 層面排除觸及路徑，維持 `cr-spec-260728-006` 的既有 non-goal）。
- 後台教材管理頁的「取消申請」入口僅限「所屬課程已取消」之訂單顯示，不擴及一般未取消課程的訂單（避免管理者繞過講師自行取消進行中課程的訂單，超出本次要解決的問題範圍）。

## Decisions

- **移除元件層級的 `if (isCancelled) return null`**，改為每個既有區塊各自的顯示條件明確加上 `!isCancelled`（開始上課、結業作業、重新招募作業、取消上課作業）；結業回退作業維持 `isCompleted` 判斷不變（`isCompleted` 與 `isCancelled` 理論上互斥，但額外排除的成本可忽略，暫不強制加，因該區塊已由 `graduateCourse` 的 `completedAt` 檢查與現行資料流程保證互斥——若日後審查發現有必要再補）。
- **「教材申請作業」顯示條件**由 `!isStarted && canManageMaterials` 改為 `(isCancelled || !isStarted) && canManageMaterials`：未取消課程維持原「開課前才顯示」邏輯；已取消課程則不論是否已開課過，皆顯示精簡版（因為訂單可能在開課前或開課後才建立）。
- **精簡版渲染**：區塊內以 `isCancelled` 分支——
  - `true`：僅渲染既有「訂單清單」UI（`MaterialOrderInfo`、狀態 pill、取消按鈕），移除單元一（學員教材需求統計）、單元二的「已申請/尚未申請」統計列、付款回填卡片、已寄送確認收貨按鈕、單元三（申請作業：申請教材／已完成申請／重新開放申請按鈕與確認視窗）。
  - `false`：維持現有完整三單元 UI，不變動。
- **修正取消按鈕條件**：原條件為 `canAct`（`= !isCancelled && !isCompleted`），會讓取消按鈕在課程已取消時恆為不顯示，與本次目標直接衝突（實作時發現，非規劃階段預期）。改為 `!isCompleted`（不含 `!isCancelled`），使已取消課程的未付款訂單可正確顯示取消按鈕，未取消課程行為不變。
- **後台教材管理頁新增入口**：`getAllCourseOrdersWithInvite`（`lib/data/course-order.ts`）的 `courseInvite.select` 補上 `cancelledAt: true`，`CourseOrderWithInvite` 型別與 mapped 物件新增 `inviteCancelledAt: Date | null`。`material-order-table.tsx` 於課程欄位（`order.inviteTitle` 旁）已取消時顯示紅色「已取消」badge；`paymentReportedAt` 為 null 時，在既有動作欄新增「取消申請」按鈕，直接呼叫 `cancelCourseOrder(order.id)`（沿用既有權限：`canAccessAdmin` 已授權，無需新增守衛）。
- **`cancelCourseOrder` 的 `revalidatePath` 補上 `/admin/materials`**：目前僅 `revalidatePath(/course/${inviteId})`，後台表格取消後不會自動刷新；因後台表格與課程頁共用同一 action，補一行 `revalidatePath('/admin/materials')` 即可兩處皆正確刷新，不需拆成兩個 action。

## Risks / Trade-offs

- [風險] 逐區塊補 `!isCancelled` 若遺漏任一區塊，會重新曝露該區塊在已取消課程的錯誤操作入口（如上述 `graduateCourse` 案例）→ Mitigation：實作時逐一核對現有 5 個區塊（教材申請、開始上課、結業作業、重新招募作業、取消上課作業）＋ 結業回退作業，明確記錄每區塊的最終條件於 tasks.md 供核對。
- [風險] 精簡版與完整版共用同一個 `orders.map(...)` 渲染邏輯，若後續完整版該區塊改版，精簡版可能不同步更新 → Mitigation：本次直接複用既有 JSX 區塊（不重寫渲染邏輯），僅新增條件包裹，降低後續維護分歧風險。
- [風險] 後台表格與課程頁各自獨立呼叫同一 `cancelCourseOrder`，若日後其中一處新增額外前置確認邏輯，另一處可能不同步 → Mitigation：本次僅在後台表格新增「確認」對話框（沿用課程頁既有的 `handleCancelOrder` 確認模式，非直接無確認點擊即刪除），行為與課程頁一致。
