## MODIFIED Requirements

### Requirement: 會員清單搜尋
管理者 SHALL 能在 `/admin/members` 頁面透過搜尋列篩選會員，搜尋條件涵蓋 `realName`、`name`、`nickname`、`email`、`spiritId` 欄位（OR 邏輯、不分大小寫、部分匹配）。搜尋條件 SHALL 透過 URL query string `?q=` 傳遞，以支援書籤與重新整理保留。表格欄位順序 SHALL 為：啟動編號、姓名、Email、加入日期、操作。

#### Scenario: 依姓名搜尋
- **WHEN** 管理者在搜尋列輸入名字後停頓（debounce）
- **THEN** 頁面更新 URL `?q=<輸入值>` 並僅顯示符合的會員

#### Scenario: 搜尋無結果
- **WHEN** 搜尋條件無任何符合的會員
- **THEN** 頁面顯示「查無符合的會員」提示文字，清單為空

#### Scenario: 清除搜尋
- **WHEN** 管理者清空搜尋列
- **THEN** 頁面顯示全部會員清單

#### Scenario: 表格欄位順序
- **WHEN** 管理者進入 `/admin/members`
- **THEN** 表格第一欄為「啟動編號」（`spiritId`），依序為姓名、Email、加入日期、操作
