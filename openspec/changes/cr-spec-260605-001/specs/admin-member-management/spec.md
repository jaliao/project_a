## ADDED Requirements

### Requirement: 會員授課老師編號顯示
會員詳情頁基本資料區 SHALL 顯示「授課老師編號」（`teacherNo`），無值時顯示「—」。會員 Excel 匯出 SHALL 新增「授課老師編號」欄。

#### Scenario: 詳情頁顯示授課老師編號
- **WHEN** 管理者開啟具 `teacherNo` 的教師之會員詳情頁
- **THEN** 基本資料區顯示「授課老師編號」及其值（如 `A001`）

#### Scenario: 無編號顯示破折號
- **WHEN** 管理者開啟純學員（`teacherNo = null`）的詳情頁
- **THEN** 「授課老師編號」欄顯示「—」

#### Scenario: 匯出含授課老師編號欄
- **WHEN** 管理者匯出會員 Excel
- **THEN** 檔案包含「授課老師編號」欄，教師列填入其編號、學員列為空
