## Why

管理者（admin/superadmin）在 Dashboard 上需要能直接執行開課操作，不需要依賴學習紀錄入口。目前 Dashboard 的學習單元對管理者意義不大，應依角色顯示不同功能入口，讓管理者的操作路徑更清晰。

## What Changes

- Dashboard 的「學習」功能單元對 admin/superadmin 隱藏（不顯示「加入學習」與「學習紀錄」）
- Dashboard 的「授課」功能單元對 admin/superadmin 仍正常顯示（新增開課、開課查詢）
- Dashboard 管理者單元（/admin 連結）維持僅 admin/superadmin 可見

## Capabilities

### New Capabilities
<!-- 無新能力，僅調整現有顯示邏輯 -->

### Modified Capabilities
- `dashboard-home`: 學習單元依角色條件顯示（admin/superadmin 不顯示學習單元）

## Impact

- `app/(user)/dashboard/page.tsx` — 學習單元加入角色判斷，admin/superadmin 不渲染該區塊
- 不需 DB schema 變更，不需 Server Action
