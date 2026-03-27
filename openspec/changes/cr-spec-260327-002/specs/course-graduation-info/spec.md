## ADDED Requirements

### Requirement: 已結業課程顯示結業資訊區塊
課程詳情頁 SHALL 在課程已結業（`completedAt` 有值）時顯示「結業資訊」區塊，包含最後一堂課程日期、已結業學員清單、未結業學員清單（含原因）。

#### Scenario: 已結業課程顯示結業區塊
- **WHEN** 使用者進入 `completedAt` 有值的課程詳情頁
- **THEN** 頁面顯示「結業資訊」區塊，包含最後一堂課程日期

#### Scenario: 未結業課程不顯示結業區塊
- **WHEN** 使用者進入 `completedAt` 為 null 的課程詳情頁
- **THEN** 頁面不顯示「結業資訊」區塊

### Requirement: 結業資訊顯示最後一堂課程日期
結業資訊區塊 SHALL 顯示「最後一堂課程日期」，格式為 `YYYY/MM/DD`（來源：`CourseInvite.completedAt`）。

#### Scenario: 顯示最後課程日期
- **WHEN** 課程已結業
- **THEN** 結業資訊區塊顯示格式化後的 `completedAt` 日期

### Requirement: 結業資訊顯示已結業學員清單
結業資訊區塊 SHALL 列出所有 `graduatedAt` 有值的已核准學員，顯示姓名。

#### Scenario: 有已結業學員
- **WHEN** 課程有 `graduatedAt` 不為 null 的 InviteEnrollment
- **THEN** 清單顯示這些學員的姓名（或 email）

#### Scenario: 全員未結業
- **WHEN** 所有 InviteEnrollment 的 `graduatedAt` 均為 null
- **THEN** 已結業清單顯示「無」

### Requirement: 結業資訊顯示未結業學員及原因
結業資訊區塊 SHALL 列出所有 `graduatedAt` 為 null 的已核准學員，顯示姓名與 `nonGraduateReason`（中文標籤）。

#### Scenario: 有未結業學員且有原因
- **WHEN** 課程有 `graduatedAt` 為 null 且 `nonGraduateReason` 有值的 InviteEnrollment
- **THEN** 清單顯示學員姓名與對應中文原因（時間不足 / 其他）

#### Scenario: 未結業學員無原因記錄
- **WHEN** 未結業學員的 `nonGraduateReason` 為 null
- **THEN** 原因欄位顯示「—」

#### Scenario: 全員結業無未結業學員
- **WHEN** 所有 InviteEnrollment 均有 `graduatedAt`
- **THEN** 未結業區塊不顯示或顯示「無」
