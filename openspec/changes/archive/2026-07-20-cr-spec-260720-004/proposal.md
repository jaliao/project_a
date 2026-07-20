# Proposal: cr-spec-260720-004 已完成申請（教材）按鈕優化

## Why

cr-spec-260720-003 之後，「已完成申請」在任何時點都可按——即使課程還有**進行中的教材訂單**（尚未收件），標記完成也無法開課（收件條件仍擋），反而造成「已完成申請」與「訂單還在跑」並存的混亂狀態；另完成狀態列放在「教材申請進度」單元，與觸發它的按鈕（申請作業單元）分離，操作動線不直覺；注意事項框框視覺過重。

## What Changes

- **「已完成申請」按鈕停用條件**：課程存在**進行中的教材訂單**（任一訂單 `receivedAt == null`）時，按鈕 SHALL 停用（灰色）；此規則 SHALL 寫入申請注意事項說明。server action `finalizeMaterialOrders` 同步驗證（有未收件訂單時拒絕）。
- **完成狀態移至申請作業單元**：按下「已完成申請」後，「教材申請已完成」訊息與「重新開放申請」按鈕 SHALL 顯示於**申請作業**單元（取代原在「教材申請進度」單元的狀態列）；「申請教材」按鈕維持停用＋提示。
- **注意事項改為清單呈現**：申請注意事項以 `<li>` 列表呈現，移除外框（框框）樣式。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-multi-material-order`：①「完成教材申請與重新開放」requirement 增加前置條件——有未收件訂單時不可標記完成（UI 停用＋server 拒絕）；②「講師端多訂單清單呈現」requirement 之申請作業單元——注意事項改列表（無框）、完成狀態（訊息＋重新開放申請）移入本單元。

## Impact

- **UI**：`app/[locale]/(user)/course/[id]/course-detail-actions.tsx`（按鈕停用條件、完成狀態列位置、注意事項樣式）
- **Server Action**：`app/actions/course-order.ts`（`finalizeMaterialOrders` 增加未收件訂單檢查）
- **i18n**：`course.material.*` 新增停用原因說明 key（zh-TW＋en，zh-CN 重新產生）
- **文件**：`doc/老師手冊.md`／`doc/管理者操作手冊.md` 同步；`config/version.json` patch +1
- **無 migration**
