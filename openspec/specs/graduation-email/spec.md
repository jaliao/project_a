# graduation-email Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for graduation-email.
## Requirements
### Requirement: 結業信範本後台維護
系統 SHALL 於 `/admin/settings` 提供結業信範本維護（主旨與內文），存於 `AdminSetting`（key `graduation_email_subject`、`graduation_email_body`），管理者（admin 與 superadmin）皆可編輯。未設定時 SHALL 使用系統預設範本。

#### Scenario: 維護結業信範本
- **WHEN** 管理者（admin 或 superadmin）於 `/admin/settings` 編輯結業信主旨與內文並儲存
- **THEN** `AdminSetting` 對應 key 更新為新值，後續寄送採用新範本

#### Scenario: 未設定時使用預設範本
- **WHEN** 尚未設定結業信範本時觸發寄送
- **THEN** 使用系統內建預設主旨與內文

#### Scenario: 主旨或內文為空時擋下儲存
- **WHEN** 管理者儲存時主旨或內文為空
- **THEN** 回傳失敗並提示必填，不更新設定

### Requirement: 結業信範本變數替換
結業信範本 SHALL 支援以下變數，寄送時以該學員實際值替換：`{{studentName}}`（學員顯示名稱）、`{{courseName}}`（課程／書籍名稱）、`{{graduationDate}}`（結業日期，格式 `YYYY/MM/DD`）、`{{spiritId}}`（靈人編號）。未支援的變數 SHALL 原樣保留，不拋出例外。

#### Scenario: 變數以學員實際值替換
- **WHEN** 寄送某結業學員的結業信
- **THEN** 範本中的 `{{studentName}}`、`{{courseName}}`、`{{graduationDate}}`、`{{spiritId}}` 被替換為該學員與課程的實際值

#### Scenario: 未知變數保留原樣
- **WHEN** 範本含未支援的 `{{xxx}}`
- **THEN** 該片段原樣保留，不影響其餘替換

### Requirement: 結業確認時自動寄送結業信
老師執行 `graduateCourse` 確認結業後，系統 SHALL 對本次結業（`graduatedAt` 設值）的每位學員寄送結業信；收件地址依 `resolveContactEmail` 規則決定。寄送在結業（`graduatedAt`／`completedAt`）已 commit 後進行並 `await` 確保送出；寄送失敗僅記錄錯誤、SHALL NOT 影響結業結果。未通過結業的學員 SHALL NOT 收到結業信。

#### Scenario: 結業學員收到結業信
- **WHEN** 老師確認結業，勾選通過的學員被設 `graduatedAt`
- **THEN** 系統對每位本次結業學員寄送結業信，收件地址依 `resolveContactEmail`（優先已驗證通訊 Email）

#### Scenario: 未結業學員不寄送
- **WHEN** 某 approved 學員於結業時未被勾選（未設 `graduatedAt`）
- **THEN** 該學員不會收到結業信

#### Scenario: 寄信失敗不影響結業
- **WHEN** 結業信寄送過程發生錯誤
- **THEN** 結業（`graduatedAt`／`completedAt`）仍成功，錯誤僅記錄於 log，不回傳失敗

#### Scenario: 僅對本次結業學員寄送
- **WHEN** 課程先前已有結業學員，本次再結業其他學員
- **THEN** 僅本次新結業（剛設 `graduatedAt`）的學員收到結業信，先前已結業者不重複寄送

