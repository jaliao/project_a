## Why

啟動靈人 1 是所有課程的入門基礎課，不應有任何先修課程。若 join table 存在殘留資料，會導致學員無法報名，形成系統死鎖。透過 migration 清除資料即可，不需修改程式邏輯。

## What Changes

- 新增 migration：清除 `_CoursePrerequisites` 中 `A = 1` 的所有資料（即啟動靈人 1 被設為需要先修的情況）
- 更新 `prisma/seed.ts`：在 prerequisiteMap 之前加一行顯式 `set: []` 確保課程 1 的先修永遠為空

## Capabilities

### New Capabilities
- `clear-course1-prerequisites`: 純資料修正——migration 清除啟動靈人 1 的先修關聯，seed 補顯式清除

### Modified Capabilities

## Impact

- `prisma/migrations/`：新增 migration SQL
- `prisma/seed.ts`：補一行顯式清除課程 1 的先修
