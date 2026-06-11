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

