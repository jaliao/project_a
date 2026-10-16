## ADDED Requirements

### Requirement: 非正式環境收件覆寫（避免誤寄真實名冊帳號）
系統 SHALL 於 `sendMailSafe` 支援環境變數 `MAIL_OVERRIDE_TO`：當該變數有設定非空值，且收件地址未命中合成 seed 網域略過規則時，SHALL 將實際 SMTP 收件地址改為 `MAIL_OVERRIDE_TO` 指定的信箱，並於信件主旨前加註原始收件地址（格式：`[原收件人: {原地址}] {原主旨}`），同時記錄略過/改寄 log。未設定 `MAIL_OVERRIDE_TO`（或為空字串）時 SHALL 維持原行為，直接寄給原始收件地址。

#### Scenario: 設定覆寫信箱時改寄
- **WHEN** 環境變數 `MAIL_OVERRIDE_TO=justin@blockcode.com.tw`，呼叫任一寄信函式（如 `sendTempPasswordEmail`）傳入收件地址 `realuser@gmail.com`
- **THEN** 實際 SMTP 收件地址為 `justin@blockcode.com.tw`，主旨前加註 `[原收件人: realuser@gmail.com]`，`realuser@gmail.com` 本人不會收到信

#### Scenario: 未設定覆寫信箱時行為不變
- **WHEN** 環境變數 `MAIL_OVERRIDE_TO` 未設定（正式環境）
- **THEN** 信件照常寄往原始收件地址，主旨不加註，行為與現況相同

#### Scenario: 合成 seed 信箱優先維持略過、不轉寄
- **WHEN** 環境變數 `MAIL_OVERRIDE_TO` 已設定，但原始收件地址為 `@seed.iwillshare.org.tw` 合成信箱
- **THEN** 仍依既有「合成 seed 信箱不寄送」規則略過、不發 SMTP 請求，不因覆寫設定而改寄到 `MAIL_OVERRIDE_TO`
