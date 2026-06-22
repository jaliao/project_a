## ADDED Requirements

### Requirement: 身分授權權限分級
身分授權（加掛/移除）SHALL 依操作者身分分級把關，作為所有授權操作的單一守衛：
- `admin` SHALL 能授予/移除書籍講師身分（`teacher_1`～`teacher_3`）與 `admin`，但 SHALL NOT 授予/移除 `superadmin`。
- `superadmin` SHALL 能授予/移除所有身分。
- 沿用既有防呆：任何人 SHALL NOT 移除「自己」的 `admin` 或 `superadmin`。

#### Scenario: admin 不可授予 superadmin
- **WHEN** 僅具 `admin`（非 `superadmin`）的管理者嘗試授予或移除某會員的 `superadmin`
- **THEN** 系統拒絕並回傳 `{ success: false, message: '無權限' }`，不變更身分

#### Scenario: admin 可授予講師身分與 admin
- **WHEN** `admin` 授予某會員 `teacher_2` 或 `admin`
- **THEN** 允許，該會員 `roles` 加入對應身分

#### Scenario: superadmin 可授予所有身分
- **WHEN** `superadmin` 授予某會員 `superadmin` 或任一書籍講師身分
- **THEN** 允許，該會員 `roles` 加入對應身分

#### Scenario: 不可移除自己的管理身分
- **WHEN** 管理者嘗試移除「自己」的 `admin` 或 `superadmin`
- **THEN** 系統拒絕，不變更
