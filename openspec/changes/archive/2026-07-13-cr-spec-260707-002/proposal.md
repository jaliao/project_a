# 設定 Mailchimp SMTP（正式環境寄信）

## Why

正式環境需要可靠的外寄信件服務。現行 dev 環境使用 Brevo SMTP，正式環境決定改用 Mailchimp Transactional（Mandrill）SMTP 寄送所有系統信件（臨時密碼、通訊 Email 驗證、密碼重設、結業信、講師授權通知等）。

## What Changes

- 正式環境 SMTP 設定切換為 Mailchimp Transactional（Mandrill）：
  - Host：`smtp.mandrillapp.com`
  - Port：`587`（STARTTLS）
  - 帳號（`SMTP_USER`）：`notice@kuaglobal.org`
  - 密碼（`SMTP_PASS`）：由管理者自行於正式環境設定，**不進版控**
  - 寄件人（`SMTP_FROM`）：`no-reply@activate.kuaglobal.org`（需於 Mandrill 完成網域驗證 SPF/DKIM）
- `lib/mailer.ts`：不需改程式邏輯（已由 `SMTP_*` 環境變數驅動）；僅更新寫死「Brevo」的註解為服務商中立描述。
- `.env.example`：SMTP 區塊範例與註解更新為 Mandrill 設定示例（去除 Brevo/Gmail 特定字樣）。
- 部署文件／操作說明補充正式環境 SMTP 環境變數清單與 Mandrill 網域驗證注意事項。

## Capabilities

### New Capabilities

- `smtp-transport-config`: 系統外寄信件的 SMTP 傳輸設定規則——一律由 `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` 環境變數驅動、port 465 走 implicit TLS 其餘走 STARTTLS、寄件人顯示為「啟動事工 <SMTP_FROM>」；正式環境採 Mailchimp Transactional（Mandrill）。

### Modified Capabilities

（無——收件人解析 `email-recipient-resolution` 等既有規格不受影響，僅傳輸層設定變更。）

## Impact

- **程式碼**：`lib/mailer.ts`（僅註解）；無行為變更。
- **設定檔**：`.env.example`（SMTP 區塊）；正式環境 `.env`（管理者手動設定，不進版控）。
- **外部相依**：Mailchimp Transactional（Mandrill）帳號 `notice@kuaglobal.org`；`activate.kuaglobal.org` 網域需完成 SPF/DKIM 驗證，否則 `SMTP_FROM` 會被拒收或進垃圾信。
- **不影響**：dev 環境現行 Brevo 設定可續用（同一套環境變數機制）；所有寄信呼叫端（`lib/mailer.ts` 的五個寄信函式）介面不變。
