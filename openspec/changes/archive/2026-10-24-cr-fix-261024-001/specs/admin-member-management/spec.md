## MODIFIED Requirements

### Requirement: 後台新增會員
系統 SHALL 在 `/admin/members` 提供「新增會員」入口，僅 `canAccessAdmin` 的使用者可使用。表單 SHALL 可填寫姓名、Email 與身分（可複選）；身分勾選清單 SHALL 僅含 `admin`／`superadmin`，SHALL NOT 提供 `teacher_1`～`teacher_3`（書籍講師身分）選項——新建帳號必然尚無任何結業紀錄，無法滿足「本人已結業對應書籍」的授予前提（見「會員身分編輯」「講師身分分頁 — 卡片式授權與確認」兩項 Requirement），須待該會員本人結業後再透過上述入口授予。送出後系統 SHALL：以既有機制核發 `spiritId`、產生隨機臨時密碼並雜湊儲存、建立 `User`（含選定身分、`isTempPassword=true`）、將 Email 寫入白名單（`isActive=true`）。系統 SHALL 於建立成功後將產生的臨時密碼回傳並顯示一次供管理者轉交。

#### Scenario: 成功新增會員
- **WHEN** 管理者填妥姓名、Email 與身分（`admin`／`superadmin`，或不選身分）並送出
- **THEN** 系統建立可登入的會員（含 `spiritId` 與臨時密碼）、加入白名單，並顯示臨時密碼供轉交

#### Scenario: Email 已存在
- **WHEN** 送出的 Email 已被現有會員使用
- **THEN** 回傳欄位錯誤（如 `{ errors: { email: ['此 Email 已被使用'] } }`），不建立會員

#### Scenario: 新會員首次登入須改密
- **WHEN** 新建會員以臨時密碼登入
- **THEN** 因 `isTempPassword=true` 被導向變更密碼流程

#### Scenario: 非管理者無法新增會員
- **WHEN** 非 `canAccessAdmin` 的使用者呼叫新增會員 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

#### Scenario: 新增會員時無法指定書籍講師身分
- **WHEN** 管理者（或繞過前端直接呼叫 Server Action 者）送出的身分包含 `teacher_1`～`teacher_3` 任一項
- **THEN** 系統回傳欄位驗證錯誤，不建立會員，亦不授予任何書籍講師身分

---

### Requirement: 會員身分編輯
詳情頁 SHALL 讓 `canAccessAdmin` 的使用者編輯會員的身分集合（加掛或移除 `teacher_1`／`teacher_2`／`teacher_3`／`admin`／`superadmin`），`user` 基線恆保留。三個書籍講師身分 SHALL 各自獨立加掛或移除。系統 SHALL NOT 允許管理者移除「自己」的 `admin` 或 `superadmin` 身分（防止把自己鎖在後台外），UI 與 Server Action 皆需防呆。

**新增書籍講師身分（`teacher_1`～`teacher_3`）前**，系統 SHALL 確認該會員已有至少一筆對應 `CourseCatalog`（依 `teacher_1`↔書 1、`teacher_2`↔書 2、`teacher_3`↔書 3 對應）的已結業（`InviteEnrollment.graduatedAt` 非空）報名紀錄；未通過者 SHALL 拒絕該筆身分變更並回傳明確錯誤訊息，不影響同批次中其他有效的身分變更判定邏輯（移除身分、`admin`／`superadmin` 的加掛或移除不受此限）。

> 現狀說明：此檢查落實於 `updateMemberRoles` Server Action 本身（輸入邊界防呆），非綁定特定畫面。截至本次變更，會員詳情頁實際唯一會呼叫此 action 的入口是「特殊設定」分頁（僅處理 `admin`／`superadmin`，不含書籍講師身分）；原先規劃可勾選 `teacher_1`～`teacher_3` 的畫面元件從未被接上任何頁面，已於本次變更確認為孤兒元件並刪除。若未來重新提供可編輯書籍講師身分的畫面，此 Requirement 的結業檢查即適用。

#### Scenario: 加掛書籍講師身分
- **WHEN** 管理者於詳情頁為已結業「啟動豐盛」的會員勾選「啟動豐盛講師」並儲存
- **THEN** 該會員身分集合加入 `teacher_2`，變更於下次請求即時生效

#### Scenario: 獨立移除單一書籍講師身分
- **WHEN** 某會員同時具備 `teacher_1` 與 `teacher_2`，管理者僅取消勾選「啟動豐盛講師」並儲存
- **THEN** 該會員身分集合保留 `teacher_1`，移除 `teacher_2`

#### Scenario: 禁止移除自身管理身分
- **WHEN** 管理者嘗試移除「自己」的 `admin` 或 `superadmin` 身分
- **THEN** 系統拒絕並回傳 `{ success: false, message: '無法移除自己的管理員身分' }`

#### Scenario: 非管理者無法編輯身分
- **WHEN** 非 `canAccessAdmin` 的使用者呼叫身分編輯 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

#### Scenario: 未結業對應書籍無法加掛講師身分
- **WHEN** 管理者為一位尚未結業「啟動靈人」的會員勾選「啟動靈人講師」並儲存
- **THEN** 系統拒絕該筆變更並回傳 `{ success: false, message: '此會員尚未結業《啟動靈人》，無法授予此講師身分' }`，該會員身分集合不變更

---

### Requirement: 講師身分分頁 — 卡片式授權與確認
講師身分分頁 SHALL 以卡片呈現三本書講師身分（`teacher_1`～`teacher_3`），顯示是否已授權。點擊卡片授予/移除 SHALL 先顯示確認對話框，確認後始執行。**授予前**，系統 SHALL 確認該會員已有至少一筆對應書籍的已結業（`InviteEnrollment.graduatedAt` 非空）報名紀錄；未通過者 SHALL 拒絕授予並顯示明確錯誤訊息，不開放以確認對話框略過此檢查。授予講師身分成功後，系統 SHALL 寄送「{書名}講師資格授權通知」信給該會員（收件依 `resolveContactEmail`）；移除不寄信，且不受此結業檢查限制。

#### Scenario: 授予講師身分並發信
- **WHEN** 管理者點擊某書講師卡片授予一位已結業對應書籍的會員，並於確認對話框確認
- **THEN** 該會員 `roles` 加入對應 `teacher_N`，並寄送授權通知信至其收件地址

#### Scenario: 移除講師身分不發信
- **WHEN** 管理者移除某書講師身分並確認
- **THEN** 該會員 `roles` 移除對應 `teacher_N`，不寄信

#### Scenario: 未確認不執行
- **WHEN** 管理者於確認對話框取消
- **THEN** 身分不變更

#### Scenario: 未結業對應書籍無法授予
- **WHEN** 管理者點擊某書講師卡片授予一位尚未結業對應書籍的會員，並於確認對話框確認
- **THEN** 系統拒絕授予，顯示「此會員尚未結業《{書名}》，無法授予此講師身分」，該會員 `roles` 不變更，不寄信
