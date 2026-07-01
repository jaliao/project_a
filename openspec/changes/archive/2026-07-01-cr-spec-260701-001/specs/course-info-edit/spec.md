## MODIFIED Requirements

### Requirement: 預計人數編輯限制
編輯課程資訊時，`maxCount` 上限 SHALL 依全域設定 `class_max_capacity`（預設 7）決定，並依操作者身分於 server 端權威套用：
- 一般使用者（課程建立者）：SHALL 滿足 1 ≤ `maxCount` ≤ `class_max_capacity`。
- 管理者（`canAccessAdmin`）：SHALL 可將 `maxCount` 設為超過 `class_max_capacity`（仍受合理硬頂防呆）。
兩者皆 SHALL NOT 低於該課程當下已核准（approved）學員數。編輯介面提示 SHALL 反映其可用上限。課程詳情的「編輯課程資訊」入口 SHALL 對管理者顯示（不限課程建立者）。

#### Scenario: 老師超過上限被拒
- **WHEN** 課程建立者將 `maxCount` 改為超過 `class_max_capacity` 並送出
- **THEN** 系統拒絕並提示上限值

#### Scenario: 管理者可超過上限
- **WHEN** 管理者將某班 `maxCount` 設為超過 `class_max_capacity`（且不低於已核准學員數）
- **THEN** 更新成功

#### Scenario: 管理者可見編輯入口
- **WHEN** 管理者檢視非其建立的招生中課程詳情
- **THEN** 顯示「編輯課程資訊」入口，可調整該班人數

#### Scenario: 低於已核准學員數被拒
- **WHEN** 課程已有 5 位已核准學員，操作者將 `maxCount` 改為 4 並送出
- **THEN** 系統拒絕並提示人數不可低於已核准學員數（5）
