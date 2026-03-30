## Context

`_CoursePrerequisites` 是 Prisma 隱式 join table，欄位 A = 擁有先修的課程 id，B = 先修課程 id。啟動靈人 1（id=1，sortOrder=0）為入門課，不應在 A 欄出現。seed.ts 現有 prerequisiteMap 已不包含 courseId=1，但歷史資料或手動操作可能留有殘留。

## Goals / Non-Goals

**Goals:**
- 透過 migration 清除 `A = 1` 的 join table 資料
- seed.ts 補顯式 set:[] 確保可重複執行不殘留

**Non-Goals:**
- 不修改 UI、Server Action 或任何業務邏輯
- 不對其他課程的先修關聯做任何異動

## Decisions

**只用 migration + seed，不加程式防護**
理由：這是資料修正，不是行為變更。入門課不設先修是資料規範，由管理員自行維護；若日後有需要防護，再以獨立 spec 處理。

**Migration 直接 DELETE，不做先查後刪**
`DELETE FROM "_CoursePrerequisites" WHERE "A" = 1` 是冪等操作，執行零筆也無副作用。

## Risks / Trade-offs

- [無資料殘留時 DELETE 無作用] → 完全安全，無需條件判斷
- [seed 重複執行] → `set: []` 已保證冪等，不會累積

## Migration Plan

1. 新增 `prisma/migrations/<timestamp>_clear_course1_prerequisites/migration.sql`
2. 執行 `make schema-update name=clear_course1_prerequisites`
3. 若需回滾：手動重新插入被清除的資料（低風險，正確狀態應為空）
