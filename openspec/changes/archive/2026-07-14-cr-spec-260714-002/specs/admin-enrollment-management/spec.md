# admin-enrollment-management Delta（cr-spec-260714-002）

## ADDED Requirements

### Requirement: 班級學員管理頁

系統 SHALL 於後台提供班級學員管理頁 `/admin/course-sessions/[id]/students`（位於 `(admin)` route group，由 group layout 守衛，頁面 SHALL NOT 自行重複權限判定）。頁首 SHALL 顯示班級編號（`CourseInvite.id`）、課程名稱、講師與課程狀態；下方 SHALL 以卡片清單列出該班全部報名學員（姓名、顯示名稱、啟動編號、email、報名狀態、結業狀態），行動裝置單欄不需橫向捲動。頁面 SHALL 提供「新增學員」按鈕；帶 `?action=add` 查詢參數開啟時 SHALL 自動開啟新增表單。

#### Scenario: 檢視班級學員清單
- **WHEN** 管理者開啟某班級的學員管理頁
- **THEN** 顯示班級編號、課程名稱、講師、狀態與全部報名學員卡片

#### Scenario: 以 action=add 進入自動開啟新增表單
- **WHEN** 管理者以 `?action=add` 開啟學員管理頁
- **THEN** 新增學員表單自動開啟

#### Scenario: 非管理者不可存取
- **WHEN** 不具 `canAccessAdmin` 者存取該頁
- **THEN** 由 `(admin)` 守衛拒絕／轉導

### Requirement: 新增學員（掛既有帳號或建新帳號）

管理者 SHALL 能對班級新增學員，表單填寫**姓名與 email**（必填），並可勾選「已結業」與指定結業日。系統 SHALL 以 email（不分大小寫）查詢既有帳號：

- **既有帳號**：SHALL 直接以該帳號建立報名；送出前 UI SHALL 顯示既有會員之姓名與啟動編號供管理者確認，避免掛錯人。
- **查無帳號**：SHALL 沿用後台新增會員機制建立帳號（核發 `spiritId`、產生臨時密碼並雜湊儲存、`isTempPassword=true`、email 加入白名單），並於成功後一次性顯示臨時密碼供管理者轉交。系統 SHALL NOT 寄送任何信件或 Inbox 通知。

報名 SHALL 以 `status=approved` 建立。同一學員於同班已有報名時 SHALL 回傳欄位錯誤、不重複建立。建帳號與建報名（含補登結業）SHALL 於單一交易內完成，失敗全部回滾。

#### Scenario: email 為既有會員
- **WHEN** 管理者輸入的 email 對應既有帳號並確認送出
- **THEN** 該帳號被加入班級（`status=approved`），不建立新帳號、不變更該帳號既有資料

#### Scenario: email 查無帳號
- **WHEN** 管理者輸入的 email 查無帳號並送出
- **THEN** 系統於交易內建立新會員（spiritId、臨時密碼、白名單）並加入班級
- **AND** 臨時密碼一次性顯示供轉交，不寄信

#### Scenario: 重複報名擋下
- **WHEN** 管理者對某班新增該班已有報名的學員
- **THEN** 回傳欄位錯誤（如「該學員已在此班級」），不建立資料

#### Scenario: 非管理者無法新增
- **WHEN** 不具 `canAccessAdmin` 者呼叫新增學員 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 補登結業

新增學員勾選「已結業」時，系統 SHALL 將該報名 `graduatedAt` 與 `joinedAt` 皆設為指定結業日（避免入班晚於結業）；若該班級 `completedAt` 為空，SHALL 於同一交易補為同日，且 UI SHALL 於勾選時提示「班級未結業將一併標記結業」。未勾選時 `joinedAt` 為當下時間、SHALL NOT 變更班級狀態。

#### Scenario: 對未結業班級補登結業
- **WHEN** 管理者新增學員並勾選已結業（結業日 D），且該班 `completedAt` 為空
- **THEN** 報名 `graduatedAt=D`、`joinedAt=D`，班級 `completedAt=D`

#### Scenario: 對已結業班級補登結業
- **WHEN** 管理者對 `completedAt` 已有值的班級新增已結業學員（結業日 D）
- **THEN** 報名 `graduatedAt=D`、`joinedAt=D`，班級 `completedAt` 維持不變

#### Scenario: 未勾選已結業
- **WHEN** 管理者新增學員未勾選已結業
- **THEN** 報名無 `graduatedAt`、`joinedAt` 為當下時間，班級狀態不變

### Requirement: 移除學員

管理者 SHALL 能自班級移除學員（實體刪除該筆 `InviteEnrollment`）。該報名有教材寄送項目（`MaterialShipmentItem`）關聯時，系統 SHALL 拒絕並提示先處理教材。移除已結業報名時，UI SHALL 先以醒目確認對話框警示影響（證書待製作、師生階層、擋修資格），管理者確認後方執行。刪除與操作紀錄寫入 SHALL 於單一交易內完成。系統 SHALL NOT 主動刪除既有 `CertificateProduction` 紀錄。

#### Scenario: 移除一般報名
- **WHEN** 管理者移除某未結業、無教材寄送關聯的報名
- **THEN** 該筆報名被刪除，學員自該班清單消失

#### Scenario: 有教材寄送關聯擋下
- **WHEN** 管理者移除的報名已有教材寄送項目
- **THEN** 系統拒絕並提示先至教材管理處理，不刪除任何資料

#### Scenario: 移除已結業報名需確認
- **WHEN** 管理者點選移除已結業的報名
- **THEN** 先顯示影響警示之確認對話框，確認後才刪除

#### Scenario: 非管理者無法移除
- **WHEN** 不具 `canAccessAdmin` 者呼叫移除學員 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`
