# course-graduation-info Delta Specification

## MODIFIED Requirements

### Requirement: 已結業課程顯示結業資訊區塊
課程詳情頁 SHALL 在「課程已結業（`completedAt` 有值）」**且**「當前使用者為**該課程授課老師（`CourseInvite.createdById` 本人）或管理者**（`admin` 或 `superadmin`）」時，顯示「結業資訊」區塊，包含最後一堂課程日期、已結業學員清單、未結業學員清單（含原因）。
未結業課程，或非上述身分者（含**持有講師身分但非本課程授課老師**的使用者、本課程學員、一般會員），SHALL NOT 顯示此區塊。身分判定 SHALL NOT 使用 `canTeachAny`（任一講師身分），以避免他班講師／具講師身分的學員檢視非其授課課程的全班結業名單。

#### Scenario: 管理者檢視已結業課程顯示結業區塊
- **WHEN** 具管理者身分（`admin` 或 `superadmin`）的使用者進入 `completedAt` 有值的課程詳情頁
- **THEN** 頁面顯示「結業資訊」區塊，包含最後一堂課程日期

#### Scenario: 該課程授課老師顯示結業區塊
- **WHEN** 該課程建立者（授課老師）進入 `completedAt` 有值的課程詳情頁
- **THEN** 頁面顯示「結業資訊」區塊

#### Scenario: 持講師身分的非授課老師不顯示
- **WHEN** 持有任一講師身分（`teacher_1`／`teacher_2`／`teacher_3`）但**非本課程建立者**的使用者進入已結業課程詳情頁
- **THEN** 頁面不顯示「結業資訊」區塊

#### Scenario: 一般會員不顯示結業區塊
- **WHEN** 僅具一般會員（`user`）身分的使用者（含已報名該課程的學員）進入 `completedAt` 有值的課程詳情頁
- **THEN** 頁面不顯示「結業資訊」區塊

#### Scenario: 未結業課程不顯示結業區塊
- **WHEN** 任何使用者進入 `completedAt` 為 null 的課程詳情頁
- **THEN** 頁面不顯示「結業資訊」區塊
