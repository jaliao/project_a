# admin-enrollment-management Specification

## Purpose
班級學員管理：管理者或該課講師於課程頁對班級新增／移除報名，修復名冊問題（遺漏學員、重複帳號搬課、同名拆帳、換班）。
## Requirements
### Requirement: 新增學員（僅限既有會員）

**管理者或該課講師**（`canAccessAdmin` 或 `CourseInvite.createdById === 當前使用者`）SHALL 能對班級新增學員，表單填寫 **Email 或啟動編號（spiritId）**（必填，單一輸入欄位）與可勾選「已結業」與指定結業日。系統 SHALL 依輸入格式（含 `@` 視為 Email，否則視為啟動編號）查詢既有帳號：

- **找到既有會員**：SHALL 直接以該帳號建立報名；送出前 UI SHALL 顯示既有會員之姓名與啟動編號供操作者確認，避免掛錯人。
- **查無會員**：系統 SHALL NOT 建立任何新帳號，SHALL 回傳欄位錯誤（提示「查無此會員，請確認 Email 或啟動編號」），UI SHALL 停用送出按鈕。

查詢既有會員之介面（lookup）SHALL 以課程歸屬授權（帶 `inviteId`，僅管理者或該課講師可查），避免任意講師枚舉會員資料。報名 SHALL 以 `status=approved` 建立。同一學員於同班已有報名時 SHALL 回傳欄位錯誤、不重複建立。建報名（含補登結業）SHALL 於單一交易內完成，失敗全部回滾。

**人數上限**：操作者非管理者（`canAccessAdmin` 為否，含該課講師本人）時，新增後之**已核准（approved）人數**若超過「班級人數上限」設定（`class_max_capacity`，預設 7），系統 SHALL 拒絕新增並回傳訊息「已達班級人數上限（N 人），如需超過請洽管理者」，不建立任何報名。**管理者**新增學員 SHALL NOT 受此上限限制。UI SHALL 於已核准人數達上限、操作者非管理者時停用送出按鈕並顯示提示，不需等送出後才被拒絕。

#### Scenario: Email 對應既有會員
- **WHEN** 管理者或該課講師輸入的 Email 對應既有帳號並確認送出
- **THEN** 該帳號被加入班級（`status=approved`），不建立新帳號、不變更該帳號既有資料

#### Scenario: 啟動編號對應既有會員
- **WHEN** 管理者或該課講師輸入既有會員的啟動編號（spiritId）並確認送出
- **THEN** 該帳號被加入班級（`status=approved`）

#### Scenario: 查無對應會員時拒絕且不建帳號
- **WHEN** 輸入的 Email 或啟動編號查無對應帳號
- **THEN** 系統回傳欄位錯誤「查無此會員，請確認 Email 或啟動編號」，SHALL NOT 建立任何新帳號，UI 送出按鈕為停用狀態

#### Scenario: 重複報名擋下
- **WHEN** 對某班新增該班已有報名的學員
- **THEN** 回傳欄位錯誤（如「該學員已在此班級」），不建立資料

#### Scenario: 非該課講師的講師無法操作
- **WHEN** 具講師身分但非該課建立者、亦非管理者的使用者呼叫新增學員或查詢
- **THEN** 回傳 `{ success: false, message: '無權限' }`

#### Scenario: 老師新增達班級人數上限 — 拒絕
- **WHEN** 該課講師（非管理者）對已核准人數等於「班級人數上限」設定值（預設 7）的班級新增學員
- **THEN** 系統回傳 `{ success: false, message: '已達班級人數上限（7 人），如需超過請洽管理者' }`，不建立報名，班級已核准人數不變

#### Scenario: 老師新增未達上限 — 允許
- **WHEN** 該課講師（非管理者）對已核准人數小於「班級人數上限」設定值的班級新增學員，且該學員為既有會員
- **THEN** 該帳號被加入班級（`status=approved`）

#### Scenario: 管理者新增可超過上限
- **WHEN** 管理者對已核准人數已達或超過「班級人數上限」設定值的班級新增學員，且該學員為既有會員
- **THEN** 該帳號被加入班級（`status=approved`），不受人數上限限制

#### Scenario: UI 已核准人數達上限時提前停用（非管理者）
- **WHEN** 該課講師（非管理者）開啟新增學員對話框，班級已核准人數已達「班級人數上限」設定值
- **THEN** 對話框顯示已達上限提示，送出按鈕為停用狀態，即使輸入查得到既有會員亦不可送出

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

**管理者或該課講師** SHALL 能自班級移除學員（實體刪除該筆 `InviteEnrollment`），移除時 SHALL 填寫**必填**移除原因；未填寫（含僅空白字元）時系統 SHALL 拒絕並回傳欄位錯誤，UI 於原因欄位為空時 SHALL 停用「確認移除」按鈕。**該報名是否有教材寄送項目（`MaterialShipmentItem`）關聯 SHALL NOT 影響是否能移除**——有教材寄送紀錄的報名一樣可以被移除；`MaterialShipmentItem.enrollmentId` 依既有 FK（`ON DELETE SET NULL`）於報名刪除時自動清空關聯，寄送紀錄本身不受影響、不會被刪除。移除已結業報名時，UI SHALL 先以醒目確認對話框警示影響（證書待製作、師生階層、擋修資格），操作者確認後方執行。刪除與操作紀錄寫入 SHALL 於單一交易內完成，操作紀錄（`AdminActionLog.detail`）SHALL 包含操作者填寫之移除原因。系統 SHALL NOT 主動刪除既有 `CertificateProduction` 紀錄。查詢報名資料、操作者資訊等資料庫讀取步驟若拋出例外，SHALL 被攔截並回傳受控錯誤訊息，不得使前端出現未受控的錯誤畫面。

#### Scenario: 移除一般報名
- **WHEN** 管理者或該課講師填寫移除原因後，移除某未結業、無教材寄送關聯的報名
- **THEN** 該筆報名被刪除，學員自該班清單消失，`AdminActionLog.detail` 包含填寫的原因

#### Scenario: 未填寫原因擋下
- **WHEN** 操作者未填寫移除原因（或僅輸入空白字元）即嘗試送出
- **THEN** UI「確認移除」按鈕為停用狀態；若仍以其他方式呼叫 Server Action，系統回傳欄位錯誤，不刪除任何資料

#### Scenario: 有教材寄送關聯仍可移除
- **WHEN** 管理者或該課講師填寫移除原因後，移除已有教材寄送項目的報名
- **THEN** 該筆報名被刪除，對應 `MaterialShipmentItem` 的 `enrollmentId` 被設為 null（寄送紀錄本身保留），管理者群組收到的通知內容註明該學員曾有教材寄送紀錄

#### Scenario: 移除已結業報名需確認
- **WHEN** 操作者點選移除已結業的報名
- **THEN** 先顯示影響警示之確認對話框，填寫原因並確認後才刪除

#### Scenario: 無權限者無法移除
- **WHEN** 非管理者且非該課建立者呼叫移除學員 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

#### Scenario: 資料庫查詢例外不再造成錯誤畫面
- **WHEN** 移除流程中的報名資料查詢或操作者資訊查詢因例外（如連線瞬斷）失敗
- **THEN** 系統攔截例外並回傳受控錯誤訊息（如「移除失敗，請稍後再試」），前端顯示 toast，不出現未受控的應用程式錯誤畫面

### Requirement: 移除成功通知管理者群組

移除學員成功後，系統 SHALL 以不阻塞主操作結果的方式（fire-and-forget，失敗僅記錄於伺服器日誌，不影響移除本身已成功回傳的結果），查詢所有具 `admin` 或 `superadmin` 身分的使用者，逐一寫入站內通知（沿用既有 `createNotification`），通知內容 SHALL 包含班級名稱、被移除學員姓名、操作者姓名、移除原因；若該報名於移除當下已有教材寄送紀錄，通知內容 SHALL 額外註明，提醒管理者留意後續教材處理。

#### Scenario: 移除成功後通知全體管理者
- **WHEN** 管理者或該課講師成功移除一筆報名
- **THEN** 系統對所有 `admin`／`superadmin` 身分使用者各寫入一筆站內通知，內容含班級名稱、被移除學員姓名、操作者姓名、移除原因

#### Scenario: 有教材寄送紀錄時通知額外註明
- **WHEN** 被移除的報名於移除當下已有教材寄送項目
- **THEN** 管理者群組收到的通知內容額外包含教材寄送提醒文字

#### Scenario: 通知寫入失敗不影響移除結果
- **WHEN** 通知寫入過程發生例外（如 DB 連線失敗）
- **THEN** 例外被攔截並記錄於伺服器日誌，移除操作本身仍回傳成功、前端仍顯示「已移除學員」

