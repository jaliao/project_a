# prosperity-seed-class Specification

## Purpose
TBD - created by archiving change cr-spec-260702-001. Update Purpose after archive.
## Requirements
### Requirement: 豐盛種子教師名單比對
系統 SHALL 解析 `doc/啟動豐盛種子教師名單.xlsx`，將名單姓名對應到名冊（`roster.json`）的學員 key，並產生 `prosperity-seed.json`；比對採精確、OpenCC 簡→繁與已確認別名/同名指定（如 `黃宣志` 指定 teacherNo B006）。

#### Scenario: 由名單產生豐盛種子班資料檔
- **WHEN** 執行 `build-prosperity-seed.mjs`
- **THEN** 系統對每位名單姓名解析到名冊 key，輸出 `prosperity-seed.json`（含 `courseCatalogId=2`、`title`、`teacherKeys`）

#### Scenario: 名單姓名無法對應時中止
- **WHEN** 有任一名單姓名經比對後仍無名冊對應
- **THEN** build script SHALL 報錯並以非零狀態結束，不產生不完整的資料檔

### Requirement: 建立黃國倫啟動豐盛種子班
系統 SHALL 於 seed 建立一個標題為「黃國倫啟動豐盛種子班」、`courseCatalogId = 2`（啟動豐盛）、建立者為黃國倫的班級，並標記課程結業，結業日為 2026/03/08。

#### Scenario: 建立已結業的豐盛種子班
- **WHEN** seed 執行且哨兵判定為全新 seed
- **THEN** 系統建立黃國倫啟動豐盛種子班，`completedAt` 設為 2026/03/08

### Requirement: 成員授予啟動豐盛講師身分並結業
名單成員 SHALL 被加入啟動豐盛種子班為已結業學員（`graduatedAt` = 2026/03/08），並在保留既有身分（如 teacher_1）的前提下加上 `teacher_2`（啟動豐盛講師）。

#### Scenario: 成員取得 teacher_2 且結業
- **WHEN** seed 將某名單成員加入豐盛種子班
- **THEN** 該成員 `roles` 疊加 `teacher_2`（不移除既有 teacher_1）
- **AND** 其報名 `graduatedAt` 設為 2026/03/08

### Requirement: 豐盛種子班建立具冪等性
系統 SHALL 僅在全新 seed（以種子班哨兵判定）時建立豐盛種子班與授予 teacher_2，避免重跑造成重複班級或重複身分。

#### Scenario: 重跑 seed 不重複建立
- **WHEN** 資料庫已存在種子班哨兵而再次執行 seed
- **THEN** 系統跳過豐盛種子班的建立與 teacher_2 授予

