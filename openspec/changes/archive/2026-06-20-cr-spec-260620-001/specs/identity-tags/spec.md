## MODIFIED Requirements

### Requirement: 啟動靈人講師標籤
系統 SHALL 根據使用者的書籍講師身分（`teacher_1`～`teacher_4`）產生對應的「{書名}講師」標籤，可同時包含多個。書名對應依 member-roles 的「講師身分與書籍對應」：`teacher_1`→「啟動靈人講師」、`teacher_2`→「啟動豐盛講師」、`teacher_3`→「啟動得勝講師」、`teacher_4`→「啟動事工 4 講師」。標籤 SHALL NOT 再以結業證書推導。

#### Scenario: 擁有啟動靈人講師身分
- **WHEN** 使用者身分集合含 `teacher_1`
- **THEN** 標籤陣列包含「啟動靈人講師」

#### Scenario: 擁有多個書籍講師身分
- **WHEN** 使用者身分集合含 `teacher_1` 與 `teacher_2`
- **THEN** 標籤陣列同時包含「啟動靈人講師」與「啟動豐盛講師」

#### Scenario: 無任何書籍講師身分
- **WHEN** 使用者身分集合不含任何 `teacher_1`～`teacher_4`
- **THEN** 標籤陣列不包含任何講師標籤
