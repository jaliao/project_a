## MODIFIED Requirements

### Requirement: 新增學員（僅限既有會員）

**管理者或該課講師**（`canAccessAdmin` 或 `CourseInvite.createdById === 當前使用者`）SHALL 能對班級新增學員，透過通用「學員選擇元件」（`StudentPicker`，見 `student-picker` 規格）以**單選**方式選定一位既有會員（模糊搜尋啟動編號／姓名／暱稱／登入 Email，或直接自操作者的社群好友清單點選），選定後 UI SHALL 顯示該既有會員之姓名與啟動編號供操作者確認，並可額外勾選「已結業」與指定結業日。

`StudentPicker` 的搜尋範圍 SHALL 以課程歸屬授權（帶 `inviteId`，僅管理者或該課講師可查），避免任意講師枚舉會員資料；搜尋結果與好友清單 SHALL 自動排除**已在該班級**（已有該 `inviteId` 報名記錄）的學員，SHALL NOT 由前端指定排除清單、SHALL 由伺服器依 `inviteId` 當下的報名名單決定。`StudentPicker` 僅能選出既有會員，系統 SHALL NOT 因本流程建立任何新帳號。

報名 SHALL 以 `status=approved` 建立，`materialChoice` SHALL 依該學員是否曾於任一班級有 `status=approved` 之報名記錄決定，不落到欄位預設值 `none`：曾有（視為上過課）SHALL 設為 `none`（已有教材）；從未有（視為新生）SHALL 設為 `traditional`（繁體教材）。建報名（含補登結業）SHALL 於單一交易內完成，失敗全部回滾。若選定後、送出前該會員帳號已不存在（極端邊界情況，如同時被刪除），系統 SHALL 回傳欄位錯誤，不建立任何報名。

**人數上限**：操作者非管理者（`canAccessAdmin` 為否，含該課講師本人）時，新增後之**已核准（approved）人數**若超過「班級人數上限」設定（`class_max_capacity`，預設 7），系統 SHALL 拒絕新增並回傳訊息「已達班級人數上限（N 人），如需超過請洽管理者」，不建立任何報名。**管理者**新增學員 SHALL NOT 受此上限限制。UI SHALL 於已核准人數達上限、操作者非管理者時停用「選擇學員」入口並顯示提示，不需等送出後才被拒絕。

#### Scenario: 透過模糊搜尋選定既有會員（新生）
- **WHEN** 管理者或該課講師在「學員選擇元件」以啟動編號、姓名、暱稱或登入 Email 模糊搜尋，選定一位既有會員並確認送出，且該帳號從未有任何班級的 `status=approved` 報名記錄
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`），不建立新帳號、不變更該帳號既有資料

#### Scenario: 直接點選社群好友完成選定（新生）
- **WHEN** 管理者或該課講師在「學員選擇元件」未輸入任何關鍵字，直接自己的社群好友清單中點選一位好友並確認送出，且該帳號從未有任何班級的 `status=approved` 報名記錄
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`）

#### Scenario: 加入已上過課的學員
- **WHEN** 管理者或該課講師選定的既有會員，於其他任一班級已有 `status=approved` 之報名記錄（曾上過課）
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=none`，視為已有教材）

#### Scenario: 已在該班級的學員不出現於選擇元件
- **WHEN** 管理者或該課講師開啟「學員選擇元件」，班級中已有某位既有會員的報名記錄
- **THEN** 該位既有會員 SHALL NOT 出現在好友清單或搜尋結果中，避免重複選取

#### Scenario: 選定後帳號已被刪除（邊界情況）
- **WHEN** 操作者於「學員選擇元件」選定某既有會員後、確認送出前，該帳號恰好被刪除
- **THEN** 系統回傳欄位錯誤，SHALL NOT 建立任何報名

#### Scenario: 非該課講師的講師無法操作
- **WHEN** 具講師身分但非該課建立者、亦非管理者的使用者呼叫新增學員或搜尋既有會員
- **THEN** 回傳 `{ success: false, message: '無權限' }`

#### Scenario: 老師新增達班級人數上限 — 拒絕
- **WHEN** 該課講師（非管理者）對已核准人數等於「班級人數上限」設定值（預設 7）的班級新增學員
- **THEN** 系統回傳 `{ success: false, message: '已達班級人數上限（7 人），如需超過請洽管理者' }`，不建立報名，班級已核准人數不變

#### Scenario: 老師新增未達上限 — 允許
- **WHEN** 該課講師（非管理者）對已核准人數小於「班級人數上限」設定值的班級新增學員，且選定的既有會員從未上過課
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`）

#### Scenario: 管理者新增可超過上限
- **WHEN** 管理者對已核准人數已達或超過「班級人數上限」設定值的班級新增學員，且選定的既有會員從未上過課
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`），不受人數上限限制

#### Scenario: UI 已核准人數達上限時提前停用（非管理者）
- **WHEN** 該課講師（非管理者）開啟新增學員對話框，班級已核准人數已達「班級人數上限」設定值
- **THEN** 對話框顯示已達上限提示，「選擇學員」入口為停用狀態，即使已選定既有會員亦不可送出

#### Scenario: 新增後學員可自行變更教材選擇
- **WHEN** 老師新增學員完成，該學員登入查看課程詳情頁，且該班教材申請尚未被講師確認完成
- **THEN** 學員可見目前教材選擇（依是否上過課為「繁體教材」或「已有教材」），並可透過「變更教材選擇」入口自行改選（見 `course-enrollment-application` 規格之「已核准學員之教材選擇檢視與變更」需求）
