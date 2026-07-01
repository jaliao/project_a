## MODIFIED Requirements

### Requirement: 預計人數上限為 7
開課（`createCourseSession`）時的預計人數上限 SHALL 依全域設定 `class_max_capacity`（預設 7）決定，取代原本固定的 7。伺服器端 SHALL 為權威驗證：一般使用者（老師）的 `maxCount` SHALL 不超過 `class_max_capacity` 且 `maxCount ≥ 1`；管理者可放寬（受硬頂防呆）。開課精靈的人數欄位上限與提示文字 SHALL 反映目前上限值。

#### Scenario: 老師開課受上限限制
- **WHEN** 老師開課填寫 `maxCount` 超過 `class_max_capacity`
- **THEN** 伺服器拒絕並提示上限值

#### Scenario: 上限值調整後即時反映
- **WHEN** 管理者將 `class_max_capacity` 調為 10 後，老師開課
- **THEN** 人數上限提示與驗證以 10 為準

#### Scenario: 下限仍為 1
- **WHEN** `maxCount` 小於 1
- **THEN** 伺服器拒絕
