# 設定 Mailchimp SMTP — 技術設計

## Context

系統所有外寄信件皆經由 `lib/mailer.ts` 的單例 Nodemailer transporter 寄出，設定完全由環境變數驅動（`SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`），`secure` 依 `SMTP_PORT === '465'` 自動判定。dev 環境現用 Brevo；正式環境決定採 Mailchimp Transactional（Mandrill）。程式碼與 `.env.example` 中有寫死「Brevo」「Gmail」的註解與範例值。

## Goals / Non-Goals

**Goals:**
- 正式環境經 Mandrill SMTP（`smtp.mandrillapp.com:587`，STARTTLS）寄信，寄件人 `no-reply@activate.kuaglobal.org`。
- 把 SMTP 傳輸設定規則正式化為 spec（`smtp-transport-config`），作為單一事實來源。
- 註解與 `.env.example` 去除服務商特定字樣，改為 Mandrill 設定示例。

**Non-Goals:**
- 不改任何寄信函式介面或收件人解析邏輯（`resolveContactEmail` 不動）。
- 不引入 Mandrill API SDK——維持標準 SMTP，避免綁定供應商。
- 不處理寄信失敗重試、佇列或寄信紀錄（另案）。
- 不變更 dev 環境現行 Brevo 設定。

## Decisions

1. **維持 SMTP 協定而非 Mandrill HTTP API**
   現有 Nodemailer + SMTP 已運作，切換供應商只需改環境變數；HTTP API 需引入 SDK 並改寫 `lib/mailer.ts`，且會綁定供應商。SMTP 為供應商中立介面。

2. **正式環境設定值**（由部署者於正式 `.env` 手動設定，不進版控）：
   - `SMTP_HOST=smtp.mandrillapp.com`
   - `SMTP_PORT=587`（STARTTLS；現有 `secure` 判定邏輯正確處理，無需改碼）
   - `SMTP_USER=notice@kuaglobal.org`
   - `SMTP_PASS=<Mandrill API key，管理者自行設定>`
   - `SMTP_FROM=no-reply@activate.kuaglobal.org`
   Mandrill SMTP 密碼即其 API key；此為機敏資料，僅存在於正式環境 `.env`。

3. **`SMTP_FROM` 與 `SMTP_USER` 分離維持現狀**
   寄件人地址（`no-reply@activate.kuaglobal.org`）與登入帳號（`notice@kuaglobal.org`）不同網域帳號，現有 `FROM_ADDRESS` 已支援（`SMTP_FROM ?? SMTP_USER` fallback），顯示名稱維持「啟動事工」。

4. **註解一般化**
   `lib/mailer.ts` 第 22 行與 `.env.example` SMTP 區塊的 Brevo/Gmail 字樣改為服務商中立描述＋Mandrill 範例，避免誤導未來維護者。

## Risks / Trade-offs

- **[網域未驗證 → 信件被拒/進垃圾信]** → 部署前須在 Mandrill 後台完成 `activate.kuaglobal.org`（寄件網域）的 SPF/DKIM 驗證；於 tasks 列為部署前置檢查項。
- **[SMTP_PASS 設錯無即時回饋]** → transporter 為 lazy 連線，設錯要到第一次寄信才爆錯；部署後以實際觸發一封信（如密碼重設）驗證。
- **[Mandrill 需付費/試用額度]** → Mailchimp Transactional 為付費服務，帳號額度由管理者確認，非本變更範圍。

## Migration Plan

1. Mandrill 後台：完成寄件網域 SPF/DKIM 驗證、取得 API key。
2. 正式環境 `.env` 設定上述五個變數，重啟容器。
3. 觸發一封實際信件（密碼重設）驗證寄達與寄件人顯示。
4. 回滾：改回原 SMTP 環境變數並重啟即可（無程式碼行為變更）。

## Open Questions

（無——密碼由管理者自行設定，網域驗證為部署前置作業。）
