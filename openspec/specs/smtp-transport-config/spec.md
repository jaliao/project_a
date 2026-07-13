# smtp-transport-config Specification

## Purpose
TBD - created by archiving change cr-spec-260707-002. Update Purpose after archive.
## Requirements
### Requirement: SMTP 傳輸設定由環境變數驅動
系統所有外寄信件 SHALL 經由單一 Nodemailer SMTP transporter 寄出，其設定 SHALL 完全由環境變數決定：`SMTP_HOST`（主機）、`SMTP_PORT`（連接埠，預設 587）、`SMTP_USER` / `SMTP_PASS`（認證）、`SMTP_FROM`（寄件人地址）。程式碼 SHALL NOT 寫死任何 SMTP 服務商特定的主機、帳號或寄件人。

#### Scenario: 切換 SMTP 服務商不需改程式碼
- **WHEN** 部署者變更 `SMTP_*` 環境變數並重啟服務
- **THEN** 所有寄信函式即以新設定寄出，程式碼無需修改

#### Scenario: Port 465 走 implicit TLS，其餘走 STARTTLS
- **WHEN** `SMTP_PORT` 為 `465`
- **THEN** transporter 以 `secure: true`（implicit TLS）連線
- **WHEN** `SMTP_PORT` 為其他值（如 `587`）
- **THEN** transporter 以 `secure: false` 連線並由 STARTTLS 升級加密

### Requirement: 寄件人顯示格式
外寄信件的寄件人 SHALL 顯示為「啟動事工 <SMTP_FROM>」；當 `SMTP_FROM` 未設定時 SHALL 退回使用 `SMTP_USER` 作為寄件地址。`SMTP_FROM` 所屬網域 MUST 於 SMTP 服務商完成寄件網域驗證（SPF/DKIM）。

#### Scenario: 寄件人使用 SMTP_FROM
- **WHEN** `SMTP_FROM=no-reply@activate.kuaglobal.org` 且系統寄出任一封信
- **THEN** 收件者看到寄件人為「啟動事工 <no-reply@activate.kuaglobal.org>」

#### Scenario: SMTP_FROM 未設定時退回 SMTP_USER
- **WHEN** `SMTP_FROM` 未設定
- **THEN** 寄件地址為 `SMTP_USER`

### Requirement: 正式環境採 Mailchimp Transactional（Mandrill）SMTP
正式環境 SHALL 使用 Mailchimp Transactional（Mandrill）SMTP 寄信：`SMTP_HOST=smtp.mandrillapp.com`、`SMTP_PORT=587`、`SMTP_USER=notice@kuaglobal.org`、`SMTP_FROM=no-reply@activate.kuaglobal.org`；`SMTP_PASS`（Mandrill API key）SHALL 由管理者於正式環境自行設定且 SHALL NOT 進入版本控制。

#### Scenario: 正式環境經 Mandrill 寄信
- **WHEN** 正式環境觸發任一外寄信件（臨時密碼、密碼重設、驗證信、結業信、講師授權通知）
- **THEN** 信件經 `smtp.mandrillapp.com:587` 寄出，寄件人為 `no-reply@activate.kuaglobal.org`

#### Scenario: 機敏憑證不進版控
- **WHEN** 檢視版本庫內容（含 `.env.example`）
- **THEN** 不存在正式環境的 `SMTP_PASS` 實際值，`.env.example` 僅含佔位示例

