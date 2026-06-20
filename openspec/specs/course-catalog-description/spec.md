# course-catalog-description Specification

## Purpose
課程目錄的「課程簡介」（description）欄位：資料模型、編輯與顯示行為。

## Requirements

### Requirement: 課程簡介欄位
`CourseCatalog` SHALL 提供選填的 `description`（`String?`）欄位。`updateCourse(id, data)` SHALL 接受 `description`，且空字串 SHALL 儲存為 `null`。

#### Scenario: 編輯並儲存課程簡介
- **WHEN** 管理者於 EditCourseDialog 的「課程簡介」Textarea 填入內容並儲存
- **THEN** 系統將該課程 `description` 更新為所填內容

#### Scenario: 清空簡介存為 null
- **WHEN** 管理者清空「課程簡介」並儲存
- **THEN** 系統將 `description` 儲存為 `null`

### Requirement: 課程簡介顯示
課程目錄管理表格（CourseCatalogTable）SHALL 顯示課程簡介，超過兩行 SHALL 截斷（`line-clamp-2`），無簡介時 SHALL 顯示「—」。

#### Scenario: 有簡介
- **WHEN** 某課程已填寫簡介
- **THEN** 表格顯示該簡介（超過兩行截斷）

#### Scenario: 無簡介
- **WHEN** 某課程未填寫簡介
- **THEN** 表格該欄顯示「—」
