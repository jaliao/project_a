## ADDED Requirements

### Requirement: 啟動靈人 1 不設先修關聯
系統 SHALL 確保 `_CoursePrerequisites` join table 中不存在 A 欄位為啟動靈人 1（id=1）的資料列。

#### Scenario: Migration 清除殘留資料
- **WHEN** 執行 migration
- **THEN** `_CoursePrerequisites` 中所有 `A = 1` 的資料列被刪除

#### Scenario: Seed 重複執行不殘留
- **WHEN** 執行 `prisma db seed` 任意次數
- **THEN** 課程 id=1 的先修列表始終為空
