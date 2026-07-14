# admin-course-sessions Specification

## Purpose
TBD - created by archiving change cr-spec-260611-003. Update Purpose after archive.
## Requirements

### Requirement: 班級編號顯示
開課管理頁每筆課程 SHALL 顯示班級編號，由共用課程卡片（`CourseSessionCard`）於課程標題上方顯示 `#編號` 承擔（見 `course-session-card`），開課管理列表不再另行渲染編號列。

#### Scenario: 列表顯示班級編號
- **WHEN** 管理者檢視開課管理列表
- **THEN** 每筆課程卡片於標題上方顯示其班級編號
