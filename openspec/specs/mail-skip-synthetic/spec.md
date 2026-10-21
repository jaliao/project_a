# mail-skip-synthetic Specification

## Purpose
TBD - created by archiving change cr-spec-260713-005. Update Purpose after archive.
## Requirements
### Requirement: 合成 seed 信箱不寄送
系統所有外寄信件（臨時密碼、通訊 Email 驗證、密碼重設、結業信、講師授權通知及未來新增信件）SHALL 於 mailer 層統一判定收件地址：地址以 `@seed.iwillshare.org.tw` 結尾（大小寫不敏感）時 SHALL 略過寄送、不發出 SMTP 請求，並記錄略過 log。略過 SHALL NOT 拋出錯誤，對呼叫端行為等同寄送成功，SHALL NOT 中斷觸發寄信的業務流程（如結業確認、帳號建立）。

#### Scenario: 結業信略過 seed 學員
- **WHEN** 老師確認結業，結業名單含 Email 為 `pa260991@seed.iwillshare.org.tw` 的學員
- **THEN** 該學員的結業信被略過（無 SMTP 請求、記 log），其他真實信箱學員照常寄送，結業流程正常完成

#### Scenario: 臨時密碼信略過 seed 帳號
- **WHEN** 管理者對合成信箱帳號觸發臨時密碼重設
- **THEN** 重設成功（臨時密碼照常產生與顯示），信件略過不寄

#### Scenario: 真實信箱不受影響
- **WHEN** 寄信對象地址為一般網域（如 `user@gmail.com`）
- **THEN** 照常寄送，行為與現況相同

#### Scenario: 大小寫不敏感
- **WHEN** 收件地址為 `PA260991@SEED.IWILLSHARE.ORG.TW`
- **THEN** 仍判定為合成信箱並略過

### Requirement: 驗證通訊 Email 後恢復寄送
合成信箱帳號若設定並完成驗證真實通訊 Email，經 `resolveContactEmail` 解析的外寄信 SHALL 寄往該真實地址、不再被略過（收件人解析規則不變，略過僅依最終收件地址判定）。

#### Scenario: seed 帳號驗證通訊 Email 後收到信
- **WHEN** 合成信箱帳號完成通訊 Email 驗證（`isCommVerified=true`）後觸發結業信
- **THEN** 信寄往已驗證的通訊 Email，正常送出

### Requirement: 無效信箱判定 helper
系統 SHALL 提供可重用的判定函式 `isUndeliverableEmail(email)`（`lib/mailer.ts` 匯出），回傳該地址是否屬合成 seed 網域，供 mailer 守門與未來 UI 提示使用。

#### Scenario: helper 判定合成信箱
- **WHEN** 以 `pa260991@seed.iwillshare.org.tw` 呼叫 `isUndeliverableEmail`
- **THEN** 回傳 `true`；一般地址回傳 `false`

### Requirement: 非正式環境收件覆寫（避免誤寄真實名冊帳號）
系統 SHALL 於 `sendMailSafe` 支援環境變數 `MAIL_OVERRIDE_TO`：當該變數有設定非空值，且收件地址未命中合成 seed 網域略過規則時，SHALL 將實際 SMTP 收件地址改為 `MAIL_OVERRIDE_TO` 指定的信箱，並移除原始 `cc`／`bcc`（若有），於信件主旨前加註原始收件範圍（格式：`[原收件人: {原 to}{; cc: {原 cc}}{; bcc: {原 bcc}}] {原主旨}`，`cc`/`bcc` 不存在時不附加對應段落），同時記錄略過/改寄 log。未設定 `MAIL_OVERRIDE_TO`（或為空字串）時 SHALL 維持原行為，直接寄給原始收件地址（含原始 `cc`/`bcc`）。

#### Scenario: 設定覆寫信箱時改寄
- **WHEN** 環境變數 `MAIL_OVERRIDE_TO=justin@blockcode.com.tw`，呼叫任一寄信函式（如 `sendTempPasswordEmail`）傳入收件地址 `realuser@gmail.com`
- **THEN** 實際 SMTP 收件地址為 `justin@blockcode.com.tw`，主旨前加註 `[原收件人: realuser@gmail.com]`，`realuser@gmail.com` 本人不會收到信

#### Scenario: 未設定覆寫信箱時行為不變
- **WHEN** 環境變數 `MAIL_OVERRIDE_TO` 未設定（正式環境）
- **THEN** 信件照常寄往原始收件地址（含原始 `cc`/`bcc`），主旨不加註，行為與現況相同

#### Scenario: 合成 seed 信箱優先維持略過、不轉寄
- **WHEN** 環境變數 `MAIL_OVERRIDE_TO` 已設定，但原始收件地址為 `@seed.iwillshare.org.tw` 合成信箱
- **THEN** 仍依既有「合成 seed 信箱不寄送」規則略過、不發 SMTP 請求，不因覆寫設定而改寄到 `MAIL_OVERRIDE_TO`

#### Scenario: 覆寫生效時 cc/bcc 不會收到真實信件
- **WHEN** 環境變數 `MAIL_OVERRIDE_TO` 已設定，呼叫端傳入的 `sendMail` 選項含 `cc: 'other@gmail.com'`
- **THEN** 實際 SMTP 請求不含該 `cc` 收件人，僅寄往 `MAIL_OVERRIDE_TO`，主旨加註包含該原始 `cc` 地址供除錯辨識

