# course-catalog-prerequisites-fix Specification

## Purpose
課程目錄先修關聯採累積式：高階課程的先修須包含其下所有階層課程。

## Requirements

### Requirement: 累積式先修關聯
課程目錄的先修關聯 SHALL 為累積式：啟動靈人 2 的先修為啟動靈人 1；啟動靈人 3 的先修為啟動靈人 1、2；啟動靈人 4 的先修為啟動靈人 1、2、3。種子資料 SHALL 以幂等方式（先清空再設定）維持此關聯。

#### Scenario: 啟動靈人 3 的先修
- **WHEN** 查詢啟動靈人 3（`courseCatalogId = 3`）的先修課程
- **THEN** 先修為啟動靈人 1 與啟動靈人 2

#### Scenario: 啟動靈人 4 的先修
- **WHEN** 查詢啟動靈人 4（`courseCatalogId = 4`）的先修課程
- **THEN** 先修為啟動靈人 1、2、3

### Requirement: 先修檢查涵蓋所有層級
`checkPrerequisites(userId, courseCatalogId)` SHALL 檢查使用者是否已結業該課程的所有先修課程。

#### Scenario: 未結業全部先修
- **WHEN** 使用者欲修啟動靈人 3，但僅結業啟動靈人 1（未結業 2）
- **THEN** `checkPrerequisites(userId, 3)` 回傳缺少啟動靈人 2

#### Scenario: 已結業全部先修
- **WHEN** 使用者已結業啟動靈人 1 與 2，欲修啟動靈人 3
- **THEN** `checkPrerequisites(userId, 3)` 回傳空（通過）
