## ADDED Requirements

### Requirement: 多地址收件地址欄位郵遞區號提示
教材申請表單多地址模式（`shipMode == multiple`）的每一筆收件地址欄位下方，SHALL 顯示提示文字，告知使用者需填寫完整地址並包含郵遞區號，與單一地址模式共用同一 i18n key（`course.material.deliveryAddressHint`）。

#### Scenario: 多地址模式各筆地址皆顯示郵遞區號提示
- **WHEN** 講師於教材申請表單選擇多地址寄送方式，某筆地址之取貨方式為宅配（非超商）
- **THEN** 該筆收件地址欄位下方顯示提示文字，提醒需包含郵遞區號

#### Scenario: 新增地址時新地址列同樣顯示提示
- **WHEN** 講師點擊「新增寄送地址」新增一筆地址列，並選擇宅配寄送
- **THEN** 新地址列的收件地址欄位下方同樣顯示郵遞區號提示文字
