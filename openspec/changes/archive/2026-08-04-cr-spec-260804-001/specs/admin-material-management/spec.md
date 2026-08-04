## ADDED Requirements

### Requirement: 教材申請列表分頁籤
`/admin/materials` SHALL 提供「全部」「待處理」「已完成」三個分頁籤篩選列表；預設顯示「全部」。「待處理」SHALL 涵蓋除「已完成」外的所有狀態（待批價、待付款、待確認收款、待寄送）；「已完成」SHALL 涵蓋已寄送、已收件。切換分頁籤 SHALL 為純前端篩選，不重新查詢伺服器資料。

#### Scenario: 預設顯示全部
- **WHEN** 管理者開啟 `/admin/materials`
- **THEN** 預設選中「全部」分頁籤，列表顯示所有申請

#### Scenario: 切換待處理分頁籤
- **WHEN** 管理者點擊「待處理」分頁籤
- **THEN** 列表僅顯示狀態為待批價、待付款、待確認收款、待寄送的申請

#### Scenario: 切換已完成分頁籤
- **WHEN** 管理者點擊「已完成」分頁籤
- **THEN** 列表僅顯示狀態為已寄送、已收件的申請

### Requirement: 教材申請列表講師欄位不顯示 Email
列表「講師」欄位 SHALL NOT 顯示該講師的 Email，僅顯示姓名。

#### Scenario: 講師欄位僅顯示姓名
- **WHEN** 管理者檢視教材申請列表
- **THEN** 「講師」欄位僅顯示講師姓名，不顯示 Email

### Requirement: 教材申請詳情整合會員標籤顯示講師
展開教材申請詳情時，若該申請關聯的 `CourseInvite` 有建立者（真實會員帳號），系統 SHALL 以「會員標籤」（見 `admin-member-tag`）呈現該講師；若申請未關聯任何 `CourseInvite`（獨立訂單），SHALL NOT 顯示會員標籤區塊。

#### Scenario: 有關聯講師時顯示會員標籤
- **WHEN** 管理者展開一筆有關聯 `CourseInvite` 的教材申請詳情
- **THEN** 詳情區顯示該講師的會員標籤，可點擊檢視或傳訊息

#### Scenario: 獨立訂單不顯示會員標籤
- **WHEN** 管理者展開一筆未關聯任何課程的獨立教材申請詳情
- **THEN** 詳情區不顯示會員標籤區塊
