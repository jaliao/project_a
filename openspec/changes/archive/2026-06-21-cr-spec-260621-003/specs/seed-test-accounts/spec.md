## ADDED Requirements

### Requirement: 明確測試帳號設定已驗證通訊 Email
seed SHALL 將明確測試帳號（`101@iwillshare.org.tw`、`gordon@test.com`、`teacher@test.com`、`student1~4@test.com`）的 `commEmail` 設為 `justin@blockcode.com.tw` 且 `isCommVerified = true`，使外寄信件依收件人解析規則集中寄至該信箱，便於測試。

#### Scenario: 測試帳號通訊 Email 已驗證
- **WHEN** seed 執行完畢後查詢上述任一明確測試帳號
- **THEN** 其 `commEmail` 為 `justin@blockcode.com.tw`，`isCommVerified` 為 `true`

#### Scenario: 測試帳號外寄信寄至通訊 Email
- **WHEN** 對某明確測試帳號寄送臨時密碼或密碼重設等外寄信
- **THEN** 依 `resolveContactEmail` 規則，收件地址為 `justin@blockcode.com.tw`

#### Scenario: 重複執行 seed 維持已驗證
- **WHEN** 重複執行 seed
- **THEN** 測試帳號的 `commEmail` 與 `isCommVerified` 維持為 `justin@blockcode.com.tw` 與 `true`
