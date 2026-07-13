# course-graduation-info Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for course-graduation-info.
## Requirements
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

### Requirement: 結業資訊—講師資格回饋入口
結業資訊區塊的已結業學員清單，SHALL 對**課程建立者**（`CourseInvite.createdBy`）在每位已結業學員旁顯示「填寫講師資格回饋」入口，並標示是否已填（已填顯示推薦狀態，未填顯示可填入口）。非課程建立者 SHALL NOT 看到此入口。

#### Scenario: 課程建立者看到回饋入口
- **WHEN** 課程建立者進入其已結業課程詳情頁的結業資訊區塊
- **THEN** 每位已結業學員旁顯示「填寫講師資格回饋」入口

#### Scenario: 已填回饋顯示狀態
- **WHEN** 某已結業學員已有講師資格回饋（`teacherRecommended` 非 null）
- **THEN** 該學員旁顯示目前推薦狀態（推薦／不推薦），並可再次編輯

#### Scenario: 非課程建立者不顯示入口
- **WHEN** 非課程建立者（含管理者或其他講師）檢視同一課程的結業資訊
- **THEN** 已結業學員清單不顯示「填寫講師資格回饋」入口

#### Scenario: 未結業學員無回饋入口
- **WHEN** 結業資訊區塊顯示未結業學員
- **THEN** 未結業學員不顯示「填寫講師資格回饋」入口

### Requirement: 結業資訊呈現老師整體回饋
課程詳情的結業資訊區塊（沿用既有 `canViewGraduation`：管理者與課程老師可見）SHALL 於已結業課程顯示老師填寫的五星評分與見證。當 `gradRating` 為 null 時 SHALL 省略星等呈現；當 `gradTestimony` 為 null/空時 SHALL 省略見證呈現；兩者皆無時整段「整體學習狀況」SHALL 不顯示。此回饋 SHALL NOT 顯示於無結業檢視權限者（含該課程學員的一般前台）。

#### Scenario: 顯示老師五星與見證
- **WHEN** 管理者或課程老師檢視已結業且有填寫回饋的課程詳情
- **THEN** 結業資訊區塊顯示對應星等與見證文字

#### Scenario: 未填則省略區段
- **WHEN** 已結業課程的 `gradRating` 與 `gradTestimony` 皆為空
- **THEN** 結業資訊區塊不顯示「整體學習狀況」段落

#### Scenario: 僅有其一時只顯示該項
- **WHEN** 課程僅填了五星（或僅填了見證）
- **THEN** 只呈現有值的該項，另一項省略

#### Scenario: 無權限者不可見
- **WHEN** 不具結業檢視權限者檢視該課程
- **THEN** 不顯示老師的五星與見證

