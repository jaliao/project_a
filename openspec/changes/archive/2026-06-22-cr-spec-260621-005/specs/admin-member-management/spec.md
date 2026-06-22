## MODIFIED Requirements

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，以四個分頁呈現：**基本資料**、**學習階層**、**講師身分**、**特殊設定**。非管理者存取 SHALL 被重新導向至 `/`。

#### Scenario: 顯示基本資料分頁
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 基本資料分頁顯示：姓名（`realName`）、暱稱（`nickname`）、Email、靈人編號（`spiritId`）、身分（所有 `roles`）、加入日期（`createdAt`）、學習紀錄（作為學員、`startedAt IS NOT NULL` 的課程）

#### Scenario: 四個分頁可切換
- **WHEN** 管理者於詳情頁切換分頁
- **THEN** 可在基本資料／學習階層／講師身分／特殊設定間切換，各自顯示對應內容

#### Scenario: 找不到會員
- **WHEN** URL 中的 id 不存在
- **THEN** 頁面顯示 404 或重新導向至 `/admin/members`

## ADDED Requirements

### Requirement: 講師身分分頁 — 推薦歷程
講師身分分頁 SHALL 唯讀顯示「推薦歷程」：他人（各課程老師）推薦此會員成為講師的回饋紀錄，來源為 `InviteEnrollment.teacherRecommended = true`（此會員為學員），欄位包含推薦書別（依課程 `courseCatalogId`）、備註（`teacherFeedbackNote`）、推薦老師（`CourseInvite.createdBy` 顯示名稱）、時間（`teacherFeedbackAt`）。

#### Scenario: 顯示推薦歷程
- **WHEN** 管理者開啟某會員的講師身分分頁，且該會員曾被推薦
- **THEN** 列出每筆推薦的書別、備註、推薦老師與時間

#### Scenario: 無推薦時顯示佔位
- **WHEN** 該會員未曾被任何老師推薦
- **THEN** 推薦歷程區顯示「尚無推薦紀錄」

### Requirement: 講師身分分頁 — 卡片式授權與確認
講師身分分頁 SHALL 以卡片呈現三本書講師身分（`teacher_1`～`teacher_3`），顯示是否已授權。點擊卡片授予/移除 SHALL 先顯示確認對話框，確認後始執行。授予講師身分成功後，系統 SHALL 寄送「{書名}講師資格授權通知」信給該會員（收件依 `resolveContactEmail`）；移除不寄信。

#### Scenario: 授予講師身分並發信
- **WHEN** 管理者點擊某書講師卡片授予並於確認對話框確認
- **THEN** 該會員 `roles` 加入對應 `teacher_N`，並寄送授權通知信至其收件地址

#### Scenario: 移除講師身分不發信
- **WHEN** 管理者移除某書講師身分並確認
- **THEN** 該會員 `roles` 移除對應 `teacher_N`，不寄信

#### Scenario: 未確認不執行
- **WHEN** 管理者於確認對話框取消
- **THEN** 身分不變更

### Requirement: 特殊設定分頁
特殊設定分頁 SHALL 提供：**暫停會員／恢復會員**（見 member-suspension）、**補發密碼**（重設臨時密碼並重新顯示）、**特殊身分授權**（授予/移除 `admin`、`superadmin`，依 member-roles 權限分級）。

#### Scenario: 補發密碼
- **WHEN** 管理者於特殊設定點「補發密碼」並確認
- **THEN** 重設臨時密碼並重新顯示一次，會員下次登入須重設

#### Scenario: 特殊身分授權依權限分級
- **WHEN** 管理者於特殊設定授予/移除 `admin`／`superadmin`
- **THEN** 依 member-roles「身分授權權限分級」判定是否允許（`admin` 不可授 `superadmin`）

#### Scenario: 暫停與恢復入口
- **WHEN** 管理者檢視特殊設定分頁
- **THEN** 未暫停者顯示「暫停會員」（原因下拉＋自填），暫停中者顯示暫停資訊與「恢復會員」
