# admin-course-sessions Delta（cr-spec-260714-002）

## MODIFIED Requirements

### Requirement: 後台課程狀態變更

後台開課管理頁 `/admin/course-sessions` 的每筆課程 SHALL 由卡片「⋯」操作選單之「變更課程狀態」項**原地開啟 dialog** 變更該課程狀態（取代原 inline 狀態下拉）。
可選目標狀態 SHALL 為「招生中」「進行中」「已取消」，且 SHALL 允許任意方向轉換（含回退）。
dialog SHALL NOT 提供「已結業」為可選目標；當課程目前為「已結業」時，SHALL 以停用方式顯示「已結業」當前狀態。
狀態變更 SHALL 由具 `canAccessAdmin` 權限者方可執行，不受開課者本人限制。
狀態變更 SHALL NOT 發送通知給講師或學員。

狀態與 `CourseInvite` 旗標對應：
- 招生中：`startedAt = NULL`、`cancelledAt = NULL`、`completedAt = NULL`
- 進行中：`startedAt = now`、`cancelledAt = NULL`、`completedAt = NULL`
- 已取消：`cancelledAt = now`

#### Scenario: 管理者將招生中課程改為進行中
- **WHEN** admin 由「⋯」選單開啟狀態 dialog 並選擇「進行中」
- **THEN** 系統將該課程 `startedAt` 設為現在時間、`cancelledAt`/`completedAt` 清空
- **AND** 列表重新整理後該課程顯示為「進行中」

#### Scenario: 管理者回退已取消課程
- **WHEN** admin 於狀態 dialog 對某「已取消」課程選擇「招生中」
- **THEN** 系統清空該課程 `startedAt`/`cancelledAt`/`completedAt`
- **AND** 該課程恢復顯示為「招生中」

#### Scenario: 後台不可設為已結業
- **WHEN** admin 檢視狀態 dialog
- **THEN** 「已結業」不是可選取的目標選項
- **AND** 若該課程目前為「已結業」，以停用狀態顯示「已結業」

#### Scenario: 變更不發通知
- **WHEN** admin 變更某課程狀態
- **THEN** 系統不寫入講師／學員的 Inbox 通知

#### Scenario: 非管理者無法變更
- **WHEN** 不具 `admin`/`superadmin` 身分者嘗試呼叫狀態變更
- **THEN** 系統拒絕並回傳無權限

## ADDED Requirements

### Requirement: 班級編號顯示

開課管理頁每筆課程 SHALL 顯示班級編號（`CourseInvite.id`，如 `#123`），桌機與行動裝置版面皆須呈現。

#### Scenario: 列表顯示班級編號
- **WHEN** 管理者檢視開課管理列表
- **THEN** 每筆課程顯示其班級編號

### Requirement: 卡片操作選單

開課管理頁每筆課程卡片右上角 SHALL 提供「⋯」操作選單，選單項依序為：**新增學員**、**移除學員**、**變更課程狀態**、**查詢 LOG**。連往獨立頁面之選單項 SHALL 以另開視窗（`target="_blank"`）開啟：

- 新增學員 → `/admin/course-sessions/[id]/students?action=add`
- 移除學員 → `/admin/course-sessions/[id]/students`
- 查詢 LOG → `/admin/operation-logs?inviteId={id}`

「變更課程狀態」非獨立頁面，SHALL 原地開啟 dialog。

#### Scenario: 選單項另開視窗
- **WHEN** 管理者點選「新增學員」「移除學員」或「查詢 LOG」
- **THEN** 以新視窗開啟對應頁面（學員管理頁或以該班過濾的操作紀錄頁），原列表頁不離開

#### Scenario: 變更課程狀態原地開啟
- **WHEN** 管理者點選「變更課程狀態」
- **THEN** 於當前頁面開啟狀態變更 dialog，不另開視窗
