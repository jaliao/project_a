# admin-enrollment-management Delta（cr-spec-260714-003）

## REMOVED Requirements

### Requirement: 班級學員管理頁
**移除原因**：後台獨立頁 `/admin/course-sessions/[id]/students` 退場，學員增刪改於前台課程頁 `/course/[id]` 的「已核准學員」區塊操作（入口需求見 `course-session-detail`）。

## MODIFIED Requirements

### Requirement: 新增學員（掛既有帳號或建新帳號）

**管理者或該課講師**（`canAccessAdmin` 或 `CourseInvite.createdById === 當前使用者`）SHALL 能對班級新增學員，表單填寫**姓名與 email**（必填），並可勾選「已結業」與指定結業日。系統 SHALL 以 email（不分大小寫）查詢既有帳號：

- **既有帳號**：SHALL 直接以該帳號建立報名；送出前 UI SHALL 顯示既有會員之姓名與啟動編號供操作者確認，避免掛錯人。
- **查無帳號**：SHALL 沿用後台新增會員機制建立帳號（核發 `spiritId`、產生臨時密碼並雜湊儲存、`isTempPassword=true`、email 加入白名單），並於成功後一次性顯示臨時密碼供操作者轉交。系統 SHALL NOT 寄送任何信件或 Inbox 通知。

email 查詢既有會員之介面（lookup）SHALL 以課程歸屬授權（帶 `inviteId`，僅管理者或該課講師可查），避免任意講師枚舉會員 email。報名 SHALL 以 `status=approved` 建立。同一學員於同班已有報名時 SHALL 回傳欄位錯誤、不重複建立。建帳號與建報名（含補登結業）SHALL 於單一交易內完成，失敗全部回滾。

#### Scenario: email 為既有會員
- **WHEN** 管理者或該課講師輸入的 email 對應既有帳號並確認送出
- **THEN** 該帳號被加入班級（`status=approved`），不建立新帳號、不變更該帳號既有資料

#### Scenario: email 查無帳號
- **WHEN** 管理者或該課講師輸入的 email 查無帳號並送出
- **THEN** 系統於交易內建立新會員（spiritId、臨時密碼、白名單）並加入班級
- **AND** 臨時密碼一次性顯示供轉交，不寄信

#### Scenario: 重複報名擋下
- **WHEN** 對某班新增該班已有報名的學員
- **THEN** 回傳欄位錯誤（如「該學員已在此班級」），不建立資料

#### Scenario: 非該課講師的講師無法操作
- **WHEN** 具講師身分但非該課建立者、亦非管理者的使用者呼叫新增學員或 email 查詢
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 移除學員

**管理者或該課講師** SHALL 能自班級移除學員（實體刪除該筆 `InviteEnrollment`）。該報名有教材寄送項目（`MaterialShipmentItem`）關聯時，系統 SHALL 拒絕並提示先處理教材。移除已結業報名時，UI SHALL 先以醒目確認對話框警示影響（證書待製作、師生階層、擋修資格），操作者確認後方執行。刪除與操作紀錄寫入 SHALL 於單一交易內完成。系統 SHALL NOT 主動刪除既有 `CertificateProduction` 紀錄。

#### Scenario: 移除一般報名
- **WHEN** 管理者或該課講師移除某未結業、無教材寄送關聯的報名
- **THEN** 該筆報名被刪除，學員自該班清單消失

#### Scenario: 有教材寄送關聯擋下
- **WHEN** 移除的報名已有教材寄送項目
- **THEN** 系統拒絕並提示先至教材管理處理，不刪除任何資料

#### Scenario: 移除已結業報名需確認
- **WHEN** 操作者點選移除已結業的報名
- **THEN** 先顯示影響警示之確認對話框，確認後才刪除

#### Scenario: 無權限者無法移除
- **WHEN** 非管理者且非該課建立者呼叫移除學員 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`
