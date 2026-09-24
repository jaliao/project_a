# admin-enrollment-management Specification

## Purpose
班級學員管理：管理者或該課講師於課程頁對班級新增／移除報名，修復名冊問題（遺漏學員、重複帳號搬課、同名拆帳、換班）。
## Requirements
### Requirement: 新增學員（僅限既有會員）

**管理者或該課講師**（`canAccessAdmin` 或 `CourseInvite.createdById === 當前使用者`）SHALL 能對班級新增學員，透過通用「學員選擇元件」（`StudentPicker`，見 `student-picker` 規格）以**單選**方式選定一位既有會員（模糊搜尋啟動編號／姓名／暱稱／登入 Email，或直接自操作者的社群好友清單點選），選定後 UI SHALL 顯示該既有會員之姓名與啟動編號供操作者確認，並可額外勾選「已結業」與指定結業日。

`StudentPicker` 的搜尋範圍 SHALL 以課程歸屬授權（帶 `inviteId`，僅管理者或該課講師可查），避免任意講師枚舉會員資料；搜尋結果與好友清單 SHALL 自動排除**已在該班級**（已有該 `inviteId` 報名記錄）的學員，SHALL NOT 由前端指定排除清單、SHALL 由伺服器依 `inviteId` 當下的報名名單決定。`StudentPicker` 僅能選出既有會員，系統 SHALL NOT 因本流程建立任何新帳號。**未完成先修課程的既有會員 SHALL 仍出現於搜尋結果與好友清單中**（可被看見、可被選取），先修資格僅於確認送出新增時驗證，不影響選擇元件本身的呈現範圍。

新增前，系統 SHALL 驗證**被選定的既有會員**是否已結業（`InviteEnrollment.graduatedAt IS NOT NULL`）該班級課程（`CourseInvite.courseCatalogId`）的所有先修課程（呼叫既有 `checkPrerequisites(userId, courseCatalogId)`，見 `course-prerequisite` 規格）。此驗證**不因操作者角色而豁免**——管理者與該課講師一律受此規則限制，與「學員自行報名」（`applyToCourse`）的先修驗證規則一致，區別於「教師開課」（`createInvite`）僅驗證操作者本人資格、且對 admin/superadmin 豁免的規則。未通過時系統 SHALL 拒絕新增，回傳欄位錯誤說明缺少哪門先修課程（顯示 `CourseCatalog.label`），不建立任何報名。

報名 SHALL 以 `status=approved` 建立，`materialChoice` SHALL 依該學員是否曾於任一班級有 `status=approved` 之報名記錄決定，不落到欄位預設值 `none`：曾有（視為上過課）SHALL 設為 `none`（已有教材）；從未有（視為新生）SHALL 設為 `traditional`（繁體教材）。建報名（含補登結業）SHALL 於單一交易內完成，失敗全部回滾。若選定後、送出前該會員帳號已不存在（極端邊界情況，如同時被刪除），系統 SHALL 回傳欄位錯誤，不建立任何報名。

**人數上限**：操作者非管理者（`canAccessAdmin` 為否，含該課講師本人）時，新增後之**已核准（approved）人數**若超過「班級人數上限」設定（`class_max_capacity`，預設 7），系統 SHALL 拒絕新增並回傳訊息「已達班級人數上限（N 人），如需超過請洽管理者」，不建立任何報名。**管理者**新增學員 SHALL NOT 受此上限限制。UI SHALL 於已核准人數達上限、操作者非管理者時停用「選擇學員」入口並顯示提示，不需等送出後才被拒絕。

#### Scenario: 透過模糊搜尋選定既有會員（新生）
- **WHEN** 管理者或該課講師在「學員選擇元件」以啟動編號、姓名、暱稱或登入 Email 模糊搜尋，選定一位既有會員並確認送出，且該帳號從未有任何班級的 `status=approved` 報名記錄，且已完成班級課程的所有先修課程
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`），不建立新帳號、不變更該帳號既有資料

#### Scenario: 直接點選社群好友完成選定（新生）
- **WHEN** 管理者或該課講師在「學員選擇元件」未輸入任何關鍵字，直接自己的社群好友清單中點選一位好友並確認送出，且該帳號從未有任何班級的 `status=approved` 報名記錄，且已完成班級課程的所有先修課程
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`）

#### Scenario: 加入已上過課的學員
- **WHEN** 管理者或該課講師選定的既有會員，於其他任一班級已有 `status=approved` 之報名記錄（曾上過課），且已完成班級課程的所有先修課程
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
- **WHEN** 該課講師（非管理者）對已核准人數小於「班級人數上限」設定值的班級新增學員，且選定的既有會員從未上過課，且已完成班級課程的所有先修課程
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`）

#### Scenario: 管理者新增可超過上限
- **WHEN** 管理者對已核准人數已達或超過「班級人數上限」設定值的班級新增學員，且選定的既有會員從未上過課，且已完成班級課程的所有先修課程
- **THEN** 該帳號被加入班級（`status=approved`，`materialChoice=traditional`），不受人數上限限制

#### Scenario: UI 已核准人數達上限時提前停用（非管理者）
- **WHEN** 該課講師（非管理者）開啟新增學員對話框，班級已核准人數已達「班級人數上限」設定值
- **THEN** 對話框顯示已達上限提示，「選擇學員」入口為停用狀態，即使已選定既有會員亦不可送出

#### Scenario: 新增後學員可自行變更教材選擇
- **WHEN** 老師新增學員完成，該學員登入查看課程詳情頁，且該班教材申請尚未被講師確認完成
- **THEN** 學員可見目前教材選擇（依是否上過課為「繁體教材」或「已有教材」），並可透過「變更教材選擇」入口自行改選（見 `course-enrollment-application` 規格之「已核准學員之教材選擇檢視與變更」需求）

#### Scenario: 選定學員缺少先修課程 — 老師新增被擋下
- **WHEN** 該課講師（非管理者）在「學員選擇元件」選定一位既有會員並確認送出，該會員尚未結業班級課程（如「啟動豐盛」）的先修課程（如「啟動靈人」）
- **THEN** 系統拒絕新增，回傳欄位錯誤「需先完成{先修課程名稱}才能加入此班級」，不建立任何報名，該會員仍可見於稍早的搜尋結果或好友清單中

#### Scenario: 選定學員缺少先修課程 — 管理者新增亦被擋下
- **WHEN** 管理者在「學員選擇元件」選定一位既有會員並確認送出，該會員尚未結業班級課程的先修課程
- **THEN** 系統同樣拒絕新增，回傳欄位錯誤，管理者身分不豁免此先修驗證

#### Scenario: 目標班級課程無先修條件時不受影響
- **WHEN** 管理者或該課講師對「啟動靈人」（無先修課程）等班級新增學員
- **THEN** 不受先修驗證影響，依既有規則（新生／曾上過課）判斷 `materialChoice` 後正常加入

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

