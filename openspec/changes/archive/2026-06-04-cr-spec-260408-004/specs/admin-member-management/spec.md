## ADDED Requirements

### Requirement: 會員管理以啟動編號搜尋
會員管理頁 SHALL 支援以啟動編號（spiritId）搜尋會員，與姓名、Email 並列為搜尋條件。

#### Scenario: 輸入啟動編號搜尋
- **WHEN** 管理員在搜尋框輸入完整或部分啟動編號（如「PA26」）
- **THEN** 系統回傳 spiritId 包含該字串的所有會員（不分大小寫）

#### Scenario: 啟動編號與姓名同時搜尋
- **WHEN** 管理員輸入可能匹配姓名或啟動編號的字串
- **THEN** 系統回傳姓名、email、spiritId 任一匹配的會員

### Requirement: 會員管理列表排序
會員管理列表 SHALL 依加入日期（新→舊）為主要排序，姓名（A→Z）為次要排序。

#### Scenario: 新加入會員排在前面
- **WHEN** 管理員開啟會員管理頁，無搜尋條件
- **THEN** 清單依 `createdAt` 降序排列，最新加入的會員排第一

#### Scenario: 同日加入者依姓名排序
- **WHEN** 多位會員在同一日加入
- **THEN** 同日會員依 `realName` 升序排列

### Requirement: 會員管理欄位標題使用「啟動編號」
會員管理表格及詳情頁 SHALL 以「啟動編號」顯示 spiritId 欄位。

#### Scenario: 會員列表欄位標題
- **WHEN** 管理員開啟會員管理列表
- **THEN** 第三欄標題顯示「啟動編號」

#### Scenario: 會員詳情欄位標籤
- **WHEN** 管理員開啟個別會員詳情頁
- **THEN** spiritId 欄位標籤顯示「啟動編號」
