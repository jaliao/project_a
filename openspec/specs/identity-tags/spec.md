# identity-tags Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for identity-tags.

## Requirements

### Requirement: 身分標籤計算邏輯
系統 SHALL 根據使用者的 `role` 與結業證書計算身分標籤陣列，可同時包含多個標籤。

#### Scenario: 系統管理員標籤
- **WHEN** 使用者 `role` 為 `admin` 或 `superadmin`
- **THEN** 標籤陣列包含「系統管理員」

#### Scenario: 一般使用者不顯示管理員標籤
- **WHEN** 使用者 `role` 為 `user`
- **THEN** 標籤陣列不包含「系統管理員」

### Requirement: 啟動靈人講師標籤
系統 SHALL 根據使用者的書籍講師身分（`teacher_1`～`teacher_3`）產生對應的「{書名}講師」標籤，可同時包含多個。書名對應依 member-roles 的「講師身分與書籍對應」：`teacher_1`→「啟動靈人講師」、`teacher_2`→「啟動豐盛講師」、`teacher_3`→「啟動得勝講師」。標籤 SHALL NOT 再以結業證書推導。

#### Scenario: 擁有啟動靈人講師身分
- **WHEN** 使用者身分集合含 `teacher_1`
- **THEN** 標籤陣列包含「啟動靈人講師」

#### Scenario: 擁有多個書籍講師身分
- **WHEN** 使用者身分集合含 `teacher_1` 與 `teacher_2`
- **THEN** 標籤陣列同時包含「啟動靈人講師」與「啟動豐盛講師」

#### Scenario: 無任何書籍講師身分
- **WHEN** 使用者身分集合不含任何 `teacher_1`～`teacher_3`
- **THEN** 標籤陣列不包含任何講師標籤

### Requirement: 無任何標籤時顯示佔位符
若標籤陣列為空，系統 SHALL 顯示「—」佔位符。

#### Scenario: 無標籤使用者
- **WHEN** 使用者 role 為 user 且無任何結業證書
- **THEN** 身分標籤區塊顯示「—」
