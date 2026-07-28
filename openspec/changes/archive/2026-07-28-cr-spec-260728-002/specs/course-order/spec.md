## ADDED Requirements

### Requirement: 單一地址收件地址欄位郵遞區號提示
教材申請表單單一地址模式（`shipMode == single`）的收件地址欄位下方，SHALL 顯示提示文字，告知使用者需填寫完整地址並包含郵遞區號，文案走 i18n key（`course.material.deliveryAddressHint`），不寫死中文。

#### Scenario: 單一地址模式顯示郵遞區號提示
- **WHEN** 講師於教材申請表單選擇單一地址寄送方式且取貨方式非超商
- **THEN** 收件地址欄位下方顯示提示文字，提醒需包含郵遞區號
