# admin-course-sessions Delta（cr-spec-260714-003）

## REMOVED Requirements

### Requirement: 後台課程狀態變更
**移除原因**：卡片「⋯」選單與狀態變更 dialog 退場；狀態操作改由前台課程頁作業區塊承擔——開始上課（既有）、重新招募作業（進行中→招生中，見 `cancel-course-session`）、取消授課、結業，皆管理者＋該課講師可操作。後台「已取消→招生中」回退與強制變更不再提供。

### Requirement: 卡片操作選單
**移除原因**：選單四項功能全數由前台課程頁取代（學員增刪→已核准學員區塊、狀態變更→作業區塊、查詢 LOG→課程操作 LOG 區塊），選單與其連往的後台頁一併刪除。

## MODIFIED Requirements

### Requirement: 班級編號顯示
開課管理頁每筆課程 SHALL 顯示班級編號，由共用課程卡片（`CourseSessionCard`）於課程標題上方顯示 `#編號` 承擔（見 `course-session-card`），開課管理列表不再另行渲染編號列。

#### Scenario: 列表顯示班級編號
- **WHEN** 管理者檢視開課管理列表
- **THEN** 每筆課程卡片於標題上方顯示其班級編號
