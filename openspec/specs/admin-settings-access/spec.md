# admin-settings-access Specification

## Purpose
TBD - created by archiving change cr-spec-260713-002. Update Purpose after archive.
## Requirements
### Requirement: 基本設定分頁管理者存取
後台系統設定 `/admin/settings`「基本設定」分頁 SHALL 對所有管理者（admin 與 superadmin）開放檢視與修改，涵蓋四項設定：學習階層展開深度（`hierarchy_depth`）、班級人數上限（`class_max_capacity`）、教材匯款帳號資訊（`remittance_account`）、結業信範本（`graduation_email_subject` / `graduation_email_body`）。頁內 SHALL NOT 另設 superadmin 限縮守衛（進入權限由 `(admin)` layout 保證）。

#### Scenario: admin 檢視基本設定
- **WHEN** 具 admin 身分（非 superadmin）的使用者開啟 `/admin/settings` 基本設定分頁
- **THEN** 顯示四項設定的表單（非「此設定需 superadmin 權限」提示）

#### Scenario: admin 可見後台入口卡
- **WHEN** admin（非 superadmin）開啟後台首頁 `/admin`
- **THEN** 功能卡清單顯示「系統設定」卡，點擊可進入 `/admin/settings`

#### Scenario: admin 修改設定
- **WHEN** admin 於基本設定分頁修改任一設定並儲存
- **THEN** 儲存成功，`AdminSetting` 更新為新值

### Requirement: 設定類 server actions 權限層級
`app/actions/admin-settings.ts` 的四個設定更新 action（`updateHierarchyDepth`、`updateClassMaxCapacity`、`updateRemittanceAccount`、`updateGraduationEmailTemplate`）SHALL 以 `canAccessAdmin` 驗證呼叫者（admin 或 superadmin 可通過），非管理者 SHALL 被拒絕。

#### Scenario: admin 呼叫設定 action
- **WHEN** admin 呼叫任一設定更新 action 並提供有效值
- **THEN** 回傳 `{ success: true }` 並寫入設定

#### Scenario: 非管理者被拒
- **WHEN** 不具 admin/superadmin 身分的使用者呼叫任一設定更新 action
- **THEN** 回傳 `{ success: false, message: '權限不足' }`，不寫入設定

