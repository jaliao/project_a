## ADDED Requirements

### Requirement: 預計人數上限為 7
新增授課時，預計人數（maxCount）SHALL 為整數且 **1 ≤ maxCount ≤ 7**（每班最多 7 人）。
建立表單 SHALL 顯示「每班最多 7 人」之提醒文字。
此規則 SHALL 同時套用於合併開課表單（`CourseSessionForm` / 開課精靈）與邀請建立表單（`create-invite-form`）。

#### Scenario: 超過 7 人被拒
- **WHEN** 講師於新增授課填入預計人數 8 並送出
- **THEN** 系統拒絕並提示每班最多 7 人

#### Scenario: 合法人數可建立
- **WHEN** 講師填入預計人數 1–7 之整數並送出
- **THEN** 課程成功建立

#### Scenario: 顯示人數提醒
- **WHEN** 講師開啟新增授課表單
- **THEN** 人數欄位旁顯示「每班最多 7 人」提醒文字
