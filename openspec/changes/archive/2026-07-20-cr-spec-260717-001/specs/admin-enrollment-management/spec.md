# admin-enrollment-management Delta（cr-spec-260717-001）

## MODIFIED Requirements

### Requirement: 新增學員（僅限既有會員）

**管理者或該課講師**（`canAccessAdmin` 或 `CourseInvite.createdById === 當前使用者`）SHALL 能對班級新增學員，表單填寫 **Email 或啟動編號（spiritId）**（必填，單一輸入欄位）與可勾選「已結業」與指定結業日。系統 SHALL 依輸入格式（含 `@` 視為 Email，否則視為啟動編號）查詢既有帳號：

- **找到既有會員**：SHALL 直接以該帳號建立報名；送出前 UI SHALL 顯示既有會員之姓名與啟動編號供操作者確認，避免掛錯人。
- **查無會員**：系統 SHALL NOT 建立任何新帳號，SHALL 回傳欄位錯誤（提示「查無此會員，請確認 Email 或啟動編號」），UI SHALL 停用送出按鈕。

查詢既有會員之介面（lookup）SHALL 以課程歸屬授權（帶 `inviteId`，僅管理者或該課講師可查），避免任意講師枚舉會員資料。報名 SHALL 以 `status=approved` 建立。同一學員於同班已有報名時 SHALL 回傳欄位錯誤、不重複建立。建報名（含補登結業）SHALL 於單一交易內完成，失敗全部回滾。

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
