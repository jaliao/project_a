# learning-record-backfill-admin Specification

## Purpose
TBD - created by archiving change cr-spec-260702-003. Update Purpose after archive.
## Requirements
### Requirement: 後台學習歷程回饋審核清單
系統 SHALL 於後台（`(admin)` 權限）提供「學習歷程回饋」頁，列出各筆回饋（送出者、類別、老師名稱、課程、備註、狀態），預設優先顯示待處理（pending）。此頁 SHALL NOT 由頁面自行重複 session／`canAccessAdmin` 判定（由 `(admin)` group layout 守衛）。

#### Scenario: 管理者檢視待處理回饋
- **WHEN** 管理者開啟學習歷程回饋頁
- **THEN** 顯示回饋清單，pending 者優先呈現

#### Scenario: 一般使用者不可存取
- **WHEN** 非管理者嘗試存取該後台頁
- **THEN** 由 `(admin)` 守衛轉導/拒絕，無法瀏覽

### Requirement: 對應老師
處理回饋時，管理者 SHALL 從現有具講師身分的使用者中選定正確老師（可依姓名/teacherNo 搜尋）；學員填寫的老師名稱僅作參考，系統 SHALL NOT 自動對應。

#### Scenario: 選定現有教師
- **WHEN** 管理者處理需建課的回饋
- **THEN** 管理者以教師選擇器綁定一位現有講師使用者作為該課程老師

### Requirement: 同意建檔（遺失學習歷程）
對 `missing_record` 回饋，管理者同意時系統 SHALL 於選定老師下新增一筆課程（`CourseInvite`，對應回饋課程目錄，`completedAt = 2025/09/01`），並將該學員加入為已結業報名（`InviteEnrollment.graduatedAt = 2025/09/01`），且將回饋標記為 approved 並記錄所建課程於 `resultInviteId`。所建課程標題 SHALL 標記來源「（補建）」。

#### Scenario: 建檔並直接畢業
- **WHEN** 管理者對 `missing_record` 回饋選定老師並同意建檔
- **THEN** 系統建立 `CourseInvite`（`completedAt=2025/09/01`、標題含「（補建）」）與該學員 `InviteEnrollment`（`graduatedAt=2025/09/01`）
- **AND** 回饋 `status=approved`、`resultInviteId` 指向新課程

### Requirement: 更正老師（老師名稱錯誤）
對 `wrong_teacher` 回饋，管理者同意時系統 SHALL 在單一交易內：移除**管理者於後台定位**的錯誤既有報名（`InviteEnrollment`），於正確老師下新增課程（標題標記「（補建）」）並將學員加入為已結業（`graduatedAt = 2025/09/01`），並標記回饋 approved。錯誤報名一律由管理者於後台選定，學員表單不指定。

#### Scenario: 移除錯誤班級並於正確老師下重建結業
- **WHEN** 管理者於後台定位要移除的錯誤報名、選定正確老師並同意
- **THEN** 系統於一個交易內移除該錯誤報名、建立正確老師的課程（標題含「（補建）」）與學員已結業報名（2025/09/01）
- **AND** 交易失敗時全部回滾，回饋維持 pending

### Requirement: 更正結業狀態（應結業卻未結業）
對 `not_graduated` 回饋，管理者同意時系統 SHALL 將管理者**於後台定位**之學員既有報名設為已結業（`graduatedAt = 2025/09/01`）並清除 `nonGraduateReason`；若該報名所屬班級尚未結業，系統 SHALL 一併補 `completedAt = 2025/09/01`。既有報名一律由管理者於後台定位，學員表單不指定。

#### Scenario: 既有報名改為已結業
- **WHEN** 管理者對 `not_graduated` 回饋於後台定位既有報名並同意
- **THEN** 該報名 `graduatedAt=2025/09/01`、`nonGraduateReason` 清空
- **AND** 若該班未結業則 `completedAt=2025/09/01`

### Requirement: 婉拒回饋
管理者 SHALL 能婉拒回饋並填寫理由，系統將回饋標記為 rejected 並記錄 `resolvedById`／`resolvedAt`／`adminNote`。

#### Scenario: 婉拒並記錄理由
- **WHEN** 管理者婉拒某筆回饋並填理由
- **THEN** 回饋 `status=rejected`，記錄處理者、時間與理由

### Requirement: 處理具冪等性
已處理（approved／rejected）之回饋 SHALL NOT 再次執行建檔或移除等副作用動作，避免重複建課。

#### Scenario: 重複處理被擋下
- **WHEN** 管理者對已 approved 的回饋再次觸發處理動作
- **THEN** 系統不重複建立課程或報名，並提示該回饋已處理

