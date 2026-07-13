# graduation-email Delta

## MODIFIED Requirements

### Requirement: 結業信範本後台維護
系統 SHALL 於 `/admin/settings` 提供結業信範本維護（主旨與內文），存於 `AdminSetting`（key `graduation_email_subject`、`graduation_email_body`），管理者（admin 與 superadmin）皆可編輯。未設定時 SHALL 使用系統預設範本。

#### Scenario: 維護結業信範本
- **WHEN** 管理者（admin 或 superadmin）於 `/admin/settings` 編輯結業信主旨與內文並儲存
- **THEN** `AdminSetting` 對應 key 更新為新值，後續寄送採用新範本

#### Scenario: 未設定時使用預設範本
- **WHEN** 尚未設定結業信範本時觸發寄送
- **THEN** 使用系統內建預設主旨與內文

#### Scenario: 主旨或內文為空時擋下儲存
- **WHEN** 管理者儲存時主旨或內文為空
- **THEN** 回傳失敗並提示必填，不更新設定
