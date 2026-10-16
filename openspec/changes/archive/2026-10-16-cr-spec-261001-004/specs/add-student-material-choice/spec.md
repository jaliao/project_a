## ADDED Requirements

### Requirement: 新增學員 Dialog 教材版本選擇
「新增學員」Dialog（`AddStudentDialog`，老師/管理者手動把既有會員加進班級）SHALL 提供教材版本選擇：四選項「繁體教材、簡體教材、英文教材、已有教材」，順序與既有書籍選購 Dialog（`course-enrollment-application` 規格）一致。Dialog SHALL 依所選學員是否曾於任一課程有 `status=approved` 之報名記錄預先選取對應選項：曾上過課 SHALL 預選「已有教材」，從未上過課（新生）SHALL 預選「繁體教材」；老師/管理者送出前仍可自由改選其他選項。選擇非「已有教材」選項時 SHALL 顯示教材所屬姓名輸入欄（**必填**，與既有書籍選購 Dialog 的驗證規則一致）。

#### Scenario: 新生預選繁體教材
- **WHEN** 老師/管理者於「新增學員」Dialog 選定一位從未上過課的學員
- **THEN** 教材版本選項「繁體教材」為預先選取狀態

#### Scenario: 曾上過課的學員預選已有教材
- **WHEN** 老師/管理者於「新增學員」Dialog 選定一位曾有 `status=approved` 報名記錄的學員
- **THEN** 教材版本選項「已有教材」為預先選取狀態

#### Scenario: 送出前可自由改選
- **WHEN** 老師/管理者將預選的選項改為其他選項（例如「英文教材」）
- **THEN** 送出新增後，該學員的 `InviteEnrollment.materialChoice` 為改選後的值

#### Scenario: 選擇已有教材不顯示姓名輸入欄
- **WHEN** 教材版本選項為「已有教材」
- **THEN** Dialog 不顯示教材所屬姓名輸入欄，送出不要求填寫姓名

#### Scenario: 選擇版本選項時顯示姓名輸入欄且為必填
- **WHEN** 教材版本選項為「繁體教材」「簡體教材」或「英文教材」
- **THEN** Dialog 顯示教材所屬姓名輸入欄；未填寫即送出時，系統顯示「請填寫教材所屬姓名」錯誤提示，不建立報名

### Requirement: 新增學員時寫入人工選擇的教材版本
`addStudentToInvite` Server Action SHALL 接受可選的 `materialChoice`／`materialBookName` 參數；呼叫端帶入時，建立的 `InviteEnrollment` SHALL 使用帶入值，取代原本一律呼叫 `getDefaultMaterialChoiceForUser` 自動判定覆蓋的行為。呼叫端未帶入 `materialChoice` 時，SHALL 維持既有自動判定行為（曾核准過其他課程 → `none`，否則 → `traditional`），確保向後相容。

#### Scenario: 帶入教材版本時採用人工選擇值
- **WHEN** `addStudentToInvite` 被呼叫時帶入 `materialChoice = 'english'`
- **THEN** 建立的 `InviteEnrollment.materialChoice` 為 `english`，不執行自動判定覆蓋

#### Scenario: 未帶入教材版本時維持自動判定
- **WHEN** `addStudentToInvite` 被呼叫時未帶入 `materialChoice`
- **THEN** 建立的 `InviteEnrollment.materialChoice` 依既有 `getDefaultMaterialChoiceForUser` 判定結果設定，行為與改版前一致

#### Scenario: 帶入教材所屬姓名
- **WHEN** `addStudentToInvite` 被呼叫時帶入 `materialChoice = 'traditional'` 與 `materialBookName = '王小明'`
- **THEN** 建立的 `InviteEnrollment.materialBookName` 為 `'王小明'`
