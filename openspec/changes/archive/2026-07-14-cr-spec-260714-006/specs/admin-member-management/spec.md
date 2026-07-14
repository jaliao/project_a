# admin-member-management Delta（cr-spec-260714-006）

## MODIFIED Requirements

### Requirement: 特殊設定分頁
特殊設定分頁 SHALL 提供：**暫停會員／恢復會員**（見 member-suspension）、**補發密碼**（重設臨時密碼並重新顯示）、**帳號修改**（變更會員登入 email，顯示目前帳號、輸入新 email、確認視窗後生效，行為依 `account-email-change` 共通規則）、**特殊身分授權**（授予/移除 `admin`、`superadmin`，依 member-roles 權限分級）。

#### Scenario: 補發密碼
- **WHEN** 管理者於特殊設定點「補發密碼」並確認
- **THEN** 重設臨時密碼並重新顯示一次，會員下次登入須重設

#### Scenario: 帳號修改
- **WHEN** 管理者於特殊設定輸入新 email 並於確認視窗（新舊 email 並列）確認
- **THEN** 該會員登入 email 依 `account-email-change` 共通規則變更，畫面更新顯示新帳號

#### Scenario: 特殊身分授權依權限分級
- **WHEN** 管理者於特殊設定授予/移除 `admin`／`superadmin`
- **THEN** 依 member-roles「身分授權權限分級」判定是否允許（`admin` 不可授 `superadmin`）

#### Scenario: 暫停與恢復入口
- **WHEN** 管理者檢視特殊設定分頁
- **THEN** 未暫停者顯示「暫停會員」（原因下拉＋自填），暫停中者顯示暫停資訊與「恢復會員」
