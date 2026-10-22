## ADDED Requirements

### Requirement: 新增代填學員（未註冊）

**管理者或該課講師**（`canAccessAdmin` 或 `CourseInvite.createdById === 當前使用者`）SHALL 能在「新增學員」流程中，除既有「選定既有會員」路徑外，另選擇「建立代填學員」路徑：僅填寫真實姓名（必填）、性別（選填）、所屬教會（選填），送出後系統 SHALL 於單一交易內：依既有 `spiritId`／`loginHandle` 核發規則建立一筆 `User`（`isProxyMember = true`、`roles = [user]`、`email = null`、`passwordHash = null`，見 `proxy-member-enrollment` 規格），並以該新帳號建立對應班級報名。

此路徑 SHALL 與既有「選定既有會員」路徑共用「新增學員（僅限既有會員）」已定義的人數上限、補登結業、教材選擇預設規則，**不豁免**先修課程驗證——新建立的代填學員沒有任何歷史報名記錄，若班級課程有先修要求，`checkPrerequisites()` 查詢後 SHALL 判定未通過並拒絕新增（與既有規則一致，不因「代填」而放行）。建立失敗（含先修未通過、已達人數上限）時，系統 SHALL NOT 建立該筆 `User`，即不留下半成品帳號。

操作紀錄 SHALL 沿用既有 `enrollment_add` 動作代碼，`AdminActionLog.detail` SHALL 註明「建立代填學員（未註冊）」以區分既有「掛既有帳號」情境。

#### Scenario: 成功建立代填學員並加入班級
- **WHEN** 管理者或該課講師於「新增學員」選擇「建立代填學員」，填寫真實姓名「王小明」、性別「男」、所屬教會，且該班課程無先修要求或人數尚未達上限
- **THEN** 系統建立一筆 `isProxyMember = true` 的 `User`（`email`／`passwordHash` 為 `null`，無 `Account`），並以 `status=approved` 建立該帳號對此班級的報名，寫入一筆 `AdminActionLog`（`action = enrollment_add`，`detail` 註明為代填建立

#### Scenario: 僅填必填姓名即可建立
- **WHEN** 操作者僅填寫真實姓名、未選性別與教會
- **THEN** 系統成功建立代填學員（性別、教會皆為預設值），不要求補填

#### Scenario: 未填真實姓名被拒絕
- **WHEN** 操作者未填寫真實姓名即嘗試送出「建立代填學員」
- **THEN** 系統回傳欄位錯誤，不建立任何帳號、不建立任何報名

#### Scenario: 代填學員仍受先修驗證擋下
- **WHEN** 管理者或該課講師對有先修要求的班級（如「啟動豐盛」）建立代填學員
- **THEN** 系統拒絕建立，回傳欄位錯誤說明缺少先修課程，不建立任何帳號、不建立任何報名

#### Scenario: 已達人數上限時代填路徑同樣被擋（非管理者）
- **WHEN** 該課講師（非管理者）對已核准人數已達「班級人數上限」的班級嘗試建立代填學員
- **THEN** 系統拒絕，回傳人數上限訊息，不建立任何帳號、不建立任何報名

#### Scenario: 管理者建立代填學員不受人數上限限制
- **WHEN** 管理者對已核准人數已達「班級人數上限」的班級建立代填學員，且該班課程無先修要求
- **THEN** 系統成功建立代填學員並加入班級，不受人數上限限制

#### Scenario: 非該課講師的講師無法建立代填學員
- **WHEN** 具講師身分但非該課建立者、亦非管理者的使用者呼叫「建立代填學員」Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`，不建立任何帳號
