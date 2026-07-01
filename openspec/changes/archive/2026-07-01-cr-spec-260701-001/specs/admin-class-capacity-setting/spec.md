## ADDED Requirements

### Requirement: 班級人數上限全域設定
後台系統設定 SHALL 提供「班級人數上限」設定（`AdminSetting` key `class_max_capacity`，預設 `7`），供管理者調整。設定值 SHALL 為正整數（合理範圍，如 1–99）。此設定 SHALL 作為開課與編輯課程時「一般使用者（老師）」的人數上限來源，取代原本固定的 7。

#### Scenario: 檢視與修改上限
- **WHEN** 具設定權限的管理者於系統設定調整「班級人數上限」為 N
- **THEN** `class_max_capacity` 更新為 N，後續開課/編輯以 N 為上限

#### Scenario: 預設值
- **WHEN** 系統尚未設定 `class_max_capacity`
- **THEN** 上限採預設值 7（與現況一致）

#### Scenario: 非法值拒絕
- **WHEN** 管理者輸入非正整數或超出合理範圍
- **THEN** 拒絕儲存並提示
