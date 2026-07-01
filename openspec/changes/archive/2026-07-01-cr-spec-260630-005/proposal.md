## Why

教材申請流程有幾處體驗需調整：後台的「編輯」訂單易造成快照資料不一致、實務上不需要；前台老師只能用「查看」對話框看訂單，不如直接內嵌顯示進度與寄送資訊；且老師送出申請後若尚未匯款卻無法取消/更正，只能被動等待。需移除後台編輯、前台改內嵌顯示、並允許匯款前取消重申請。

## What Changes

- **後台移除編輯**：教材申請詳情移除「編輯」按鈕與 `MaterialOrderEditDialog`（不再事後修改訂單快照）。
- **前台內嵌顯示訂單資訊**：移除「查看教材申請」按鈕與唯讀對話框，改於每筆訂單列**內嵌顯示**：書本數量（繁/簡）、取貨方式（含地址/門市）、收件人與電話、寄送時間、收件時間（多地址則逐地址）。
- **匯款前可取消重申請**：訂單於「待批價／待付款」（`paymentReportedAt` 為 null，即老師尚未回填匯款後五碼）時，顯示「取消申請」；取消即**刪除該 `CourseOrder`**（連帶刪除其寄送批次與書本項目，該批書回到未指派），老師可重新申請。

## Capabilities

### New Capabilities

- `material-order-cancel`: 老師於回填匯款前可取消教材訂單（刪除訂單、釋放書本項目以重新申請）。

### Modified Capabilities

- `admin-material-management`: 移除教材申請詳情的「編輯」功能。
- `material-order-application`: 前台以內嵌方式顯示各訂單的進度與寄送資訊（取代唯讀查看對話框）。

## Impact

- `components/admin/material-order-table.tsx`：移除編輯按鈕、編輯狀態與 `MaterialOrderEditDialog` 使用；`components/admin/material-order-edit-dialog.tsx` 成 dead code（移除）
- `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：訂單列改內嵌顯示；移除「查看」與唯讀 `MaterialOrderDialog`（保留新申請流程）；新增「取消申請」按鈕
- `app/actions/course-order.ts`：新增 `cancelCourseOrder`（驗證擁有者＋`paymentReportedAt` 為 null，刪除訂單 cascade 寄送/項目、`revalidatePath`）；`updateMaterialOrderAdmin` 若不再使用則移除
- `doc/管理者操作手冊.md`、`doc/老師手冊.md`、`config/version.json`、README-AI
- 無 DB migration（`MaterialShipment`/`MaterialShipmentItem` 已 cascade delete）
