# phone-validation Specification

## Purpose
TBD - created by archiving change cr-spec-260713-004. Update Purpose after archive.
## Requirements
### Requirement: 電話欄位格式驗證
個人資料（`updateProfileSchema`）與首次登入 Step 2（`onboardingProfileSchema`）的手機號碼欄位 SHALL 接受以下任一格式：台灣手機 `09` 開頭共 10 碼數字，或 E.164 國際格式（`+` 開頭、國碼首位 1–9、總計 8–15 位數字）。兩個 schema SHALL 共用同一驗證規則（單一 regex 常數）。格式不符 SHALL 回傳 `validation.phoneInvalid` key，由呈現端翻譯。

#### Scenario: 台灣手機格式通過
- **WHEN** 使用者輸入 `0912345678`
- **THEN** 驗證通過

#### Scenario: 國際格式通過
- **WHEN** 使用者輸入 `+12025550123` 或 `+886912345678`
- **THEN** 驗證通過，onboarding 可完成、個人資料可儲存

#### Scenario: 非法格式拒絕
- **WHEN** 使用者輸入 `12345`、`+012345678`（國碼首位 0）或含空格/連字號的號碼
- **THEN** 驗證失敗，顯示 `validation.phoneInvalid` 對應訊息

#### Scenario: 個人資料電話可留空
- **WHEN** 使用者於個人資料表單將電話清空後儲存
- **THEN** 驗證通過（選填行為不變；onboarding Step 2 仍為必填）

### Requirement: 電話格式提示文案
電話欄位的錯誤訊息（`validation.phoneInvalid`）與 placeholder（`profile.phonePlaceholder`）SHALL 說明同時接受台灣與國際格式並附國際範例。文案 SHALL 依 i18n 規範維護於 `messages/zh-TW.json`（來源）與 `messages/en.json`，簡體由 OpenCC 自動產生。

#### Scenario: 錯誤訊息含國際格式說明
- **WHEN** 輸入不符格式的號碼觸發驗證錯誤
- **THEN** 訊息說明接受「台灣 09xxxxxxxx 或國際格式（如 +12025550123）」

