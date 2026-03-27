## ADDED Requirements

### Requirement: CourseCardGrid 共用網格元件
系統 SHALL 提供 `CourseCardGrid` 元件（`components/course-session/course-card-grid.tsx`），作為課程卡片的響應式網格容器，統一管理欄數規則。

#### Scenario: 行動裝置（< sm）顯示單欄
- **WHEN** 視窗寬度小於 640px
- **THEN** 課程卡片以單欄排列

#### Scenario: 平板（sm）顯示兩欄
- **WHEN** 視窗寬度介於 640px 到 1023px
- **THEN** 課程卡片以兩欄排列

#### Scenario: 桌機（lg）顯示三欄
- **WHEN** 視窗寬度介於 1024px 到 1279px
- **THEN** 課程卡片以三欄排列

#### Scenario: 大螢幕（xl）顯示四欄
- **WHEN** 視窗寬度大於等於 1280px
- **THEN** 課程卡片以四欄排列

### Requirement: CourseCardGrid 跨頁面共用
`CourseCardGrid` SHALL 同時被首頁課程區塊（`/user/[spiritId]`）與我的開課頁面（`/user/[spiritId]/courses`）使用。

#### Scenario: 首頁課程區塊使用 CourseCardGrid
- **WHEN** 使用者載入 `/user/[spiritId]` 頁面
- **THEN** 課程列表以 CourseCardGrid 網格規則排列

#### Scenario: 我的開課頁面使用 CourseCardGrid
- **WHEN** 使用者載入 `/user/[spiritId]/courses` 頁面
- **THEN** 開課列表以 CourseCardGrid 網格規則排列
