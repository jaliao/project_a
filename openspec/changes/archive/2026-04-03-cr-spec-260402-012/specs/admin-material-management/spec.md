## ADDED Requirements

### Requirement: 管理者可編輯申請快照欄位
後台管理頁每筆申請 SHALL 提供「編輯」按鈕，開啟編輯 Dialog 讓管理者修改自動帶入的快照欄位與統一編號。

#### Scenario: 點擊編輯顯示 Dialog
- **WHEN** 管理者點擊某筆申請的「編輯」按鈕
- **THEN** 開啟 MaterialOrderEditDialog，預填該申請目前的所有快照欄位值

#### Scenario: 編輯 Dialog 包含所有可修改欄位
- **WHEN** MaterialOrderEditDialog 開啟
- **THEN** 顯示以下欄位供編輯：購買人中文姓名、購買人英文姓名、教師姓名、所屬教會/單位、Email、電話、預計開課日期、統一編號

#### Scenario: 儲存成功後列表刷新
- **WHEN** 管理者填寫欄位後送出
- **THEN** 呼叫 `updateMaterialOrderAdmin(orderId, data)`，成功後 Dialog 關閉、列表刷新，顯示「已更新申請資料」toast

#### Scenario: 非管理者無法呼叫 updateMaterialOrderAdmin
- **WHEN** role 非 admin/superadmin 的使用者呼叫 `updateMaterialOrderAdmin`
- **THEN** 回傳 `{ success: false, message: '無權限' }`

#### Scenario: 展開詳情顯示快照欄位值
- **WHEN** 管理者展開某筆申請的詳情
- **THEN** 顯示購買人中文姓名、英文姓名、教師姓名、所屬教會/單位、Email、電話、預計開課日期（及現有的取貨資訊與統一編號）
