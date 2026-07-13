# material-order-payment Delta

> 基礎版本：本 delta 以 `cr-spec-260713-001` 修改後的「匯款帳號系統設定」為底（多行匯款帳號資訊），僅放寬設定權限；歸檔/sync 順序須 -001 在前。

## MODIFIED Requirements

### Requirement: 匯款帳號系統設定
系統 SHALL 於 `/admin/settings` 提供可設定的多行「匯款帳號資訊」（`AdminSetting` key `remittance_account`），輸入欄 SHALL 為 textarea 以支援多行文字，管理者（admin 與 superadmin）皆可設定。測試環境預設值 SHALL 為：

```
第一銀行淡水分行
戶名：希望之聲文化有限公司
銀行代碼：007
帳號：218-10-002087
```

批價表單的帳號資訊欄 SHALL 預設帶入此設定值。

#### Scenario: 預設匯款帳號資訊
- **WHEN** 尚未設定 `remittance_account` 時讀取設定
- **THEN** 回傳上述多行預設值（第一銀行淡水分行／戶名／銀行代碼／帳號四行）

#### Scenario: 管理者更新匯款帳號資訊
- **WHEN** 管理者（admin 或 superadmin）於 `/admin/settings` 以 textarea 儲存新的多行匯款帳號資訊
- **THEN** `AdminSetting` key `remittance_account` 更新為新值（保留換行），後續批價表單帶入新值

#### Scenario: 多行內容完整保存
- **WHEN** 管理者儲存含換行的匯款帳號資訊
- **THEN** 重新載入設定頁後 textarea 顯示原有換行格式，不被壓縮為單行
