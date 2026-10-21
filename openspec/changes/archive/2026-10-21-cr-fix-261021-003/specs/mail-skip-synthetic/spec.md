## MODIFIED Requirements

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
