## ADDED Requirements

### Requirement: 後台課程狀態變更
後台開課管理頁 `/admin/course-sessions` 的每筆課程 SHALL 提供 inline 狀態下拉選單，供 admin/superadmin 直接變更該課程狀態。
可選目標狀態 SHALL 為「招生中」「進行中」「已取消」，且 SHALL 允許任意方向轉換（含回退）。
下拉 SHALL NOT 提供「已結業」為可選目標；當課程目前為「已結業」時，下拉 SHALL 以停用方式顯示「已結業」當前狀態。
狀態變更 SHALL 由具 `canAccessAdmin` 權限者方可執行，不受開課者本人限制。
狀態變更 SHALL NOT 發送通知給講師或學員。

狀態與 `CourseInvite` 旗標對應：
- 招生中：`startedAt = NULL`、`cancelledAt = NULL`、`completedAt = NULL`
- 進行中：`startedAt = now`、`cancelledAt = NULL`、`completedAt = NULL`
- 已取消：`cancelledAt = now`

#### Scenario: 管理者將招生中課程改為進行中
- **WHEN** admin 在某「招生中」課程的狀態下拉選擇「進行中」
- **THEN** 系統將該課程 `startedAt` 設為現在時間、`cancelledAt`/`completedAt` 清空
- **AND** 列表重新整理後該課程顯示為「進行中」

#### Scenario: 管理者回退已取消課程
- **WHEN** admin 在某「已取消」課程的狀態下拉選擇「招生中」
- **THEN** 系統清空該課程 `startedAt`/`cancelledAt`/`completedAt`
- **AND** 該課程恢復顯示為「招生中」

#### Scenario: 後台不可設為已結業
- **WHEN** admin 檢視狀態下拉
- **THEN** 「已結業」不是可選取的目標選項
- **AND** 若該課程目前為「已結業」，下拉以停用狀態顯示「已結業」

#### Scenario: 變更不發通知
- **WHEN** admin 變更某課程狀態
- **THEN** 系統不寫入講師／學員的 Inbox 通知

#### Scenario: 非管理者無法變更
- **WHEN** 不具 `admin`/`superadmin` 身分者嘗試呼叫狀態變更
- **THEN** 系統拒絕並回傳無權限
