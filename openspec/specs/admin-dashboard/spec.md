# admin-dashboard Specification

## Purpose
TBD - created by archiving change cr-spec-260611-001. Update Purpose after archive.
## Requirements
### Requirement: 後台儀錶板頁面
系統 SHALL 提供 `/admin/dashboard` 頁面，供 admin/superadmin 查看系統整體統計。
roles 不含 `admin`/`superadmin` 者 SHALL redirect 至 `/`。

#### Scenario: 管理者進入儀錶板
- **WHEN** admin 或 superadmin 訪問 `/admin/dashboard`
- **THEN** 頁面顯示統計卡片

#### Scenario: 一般使用者被拒絕
- **WHEN** roles 僅為 `user` 的使用者訪問 `/admin/dashboard`
- **THEN** 系統 redirect 至 `/`

### Requirement: 統計數據卡片
頁面 SHALL 顯示以下六個統計卡片：
1. **總會員數**：系統中所有 User 總數
2. **啟動靈人講師資格人數**：同時具備 `teacher` 身分 AND 至少一筆 CourseCatalog id=1 結業紀錄（`graduatedAt IS NOT NULL`）的不重複使用者數
3. **啟動豐盛講師資格人數**：同時具備 `teacher` 身分 AND 至少一筆 CourseCatalog id=2 結業紀錄（`graduatedAt IS NOT NULL`）的不重複使用者數
4. **開課中課程總數**：`startedAt IS NULL AND cancelledAt IS NULL AND completedAt IS NULL` 的 CourseInvite 數
5. **進行中課程總數**：`startedAt IS NOT NULL AND cancelledAt IS NULL AND completedAt IS NULL` 的 CourseInvite 數
6. **已結業課程總數**：`completedAt IS NOT NULL` 的 CourseInvite 數

僅具 `admin`/`superadmin` 而未加掛 `teacher` 者，SHALL NOT 計入第 2、3 項講師資格人數。

#### Scenario: 統計卡片顯示正確數值
- **WHEN** 管理者進入儀錶板
- **THEN** 六個卡片分別顯示對應的最新計算數值

#### Scenario: 講師資格需身分與結業同時成立
- **WHEN** 某使用者已結業啟動靈人（id=1）但 roles 不含 `teacher`
- **THEN** 該使用者 SHALL NOT 計入「啟動靈人講師資格人數」

#### Scenario: 講師結業前不計入
- **WHEN** 某使用者具 `teacher` 身分但尚未結業啟動豐盛（id=2）
- **THEN** 該使用者 SHALL NOT 計入「啟動豐盛講師資格人數」

### Requirement: 功能卡動態待辦副標題
後台儀錶板功能卡 SHALL 依即時待辦數呈現動態副標題：
- **推薦講師**卡：當有未處理推薦（狀態 pending）時，副標題 SHALL 顯示待處理筆數提示；為 0 時 SHALL 顯示預設說明。
- **教材作業**卡：當有待管理者處理的教材訂單（狀態為待批價／待確認收款／待寄送）時，副標題 SHALL 顯示待辦筆數提示；為 0 時 SHALL 顯示預設說明。

待辦計數 SHALL 與各自清單的狀態推導一致（教材沿用 `getMaterialOrderStatusKey`；推薦沿用推薦狀態推導）。

#### Scenario: 有待處理推薦顯示提示
- **WHEN** 存在未處理的講師推薦
- **THEN** 「推薦講師」卡副標題顯示待處理推薦筆數

#### Scenario: 無待處理推薦顯示預設
- **WHEN** 無未處理推薦
- **THEN** 「推薦講師」卡副標題顯示預設說明文字

#### Scenario: 教材有待辦顯示提示
- **WHEN** 存在狀態為待批價／待確認收款／待寄送的教材訂單
- **THEN** 「教材作業」卡副標題顯示待辦筆數提示

#### Scenario: 教材無待辦顯示預設
- **WHEN** 無上述待辦訂單
- **THEN** 「教材作業」卡副標題顯示預設說明文字

