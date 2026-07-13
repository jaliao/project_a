# Tasks — 設定 Mailchimp SMTP（cr-spec-260707-002）

## 1. 程式碼與範例檔清理

- [x] 1.1 `lib/mailer.ts`：將寫死「Brevo」的註解改為服務商中立描述（寄件人需為 SMTP 服務商已驗證的網域地址），並更新檔頭 Updated 日期；不改任何邏輯
- [x] 1.2 `.env.example`：SMTP 區塊改為 Mandrill 設定示例（`smtp.mandrillapp.com` / `587` / `notice@kuaglobal.org` / `SMTP_PASS` 佔位符 / `no-reply@activate.kuaglobal.org`），註解去除 Brevo/Gmail 字樣並註明 Mandrill 密碼即 API key、寄件網域須完成 SPF/DKIM 驗證

## 2. 文件與版本

- [x] 2.1 檢查 `doc/` 三份操作手冊是否有提及寄信服務商或寄件人地址的內容，如有則同步修正（純基礎設施變更，預期無使用者可見流程改變）
- [x] 2.2 `config/version.json` patch 版本號 +1
- [x] 2.3 依 `.ai-rules.md` 更新 `README-AI.md`（反映新版本號與 SMTP 設定說明）

## 3. 驗證

- [x] 3.1 `npm run lint` 與 `npm run build` 通過
- [x] 3.2 確認版本庫（含 `.env.example`）不含任何正式環境 `SMTP_PASS` 實際值

## 4. 部署（管理者手動，非程式碼任務）

- [x] 4.1 Mandrill 後台完成 `activate.kuaglobal.org` 寄件網域 SPF/DKIM 驗證，取得 API key
- [x] 4.2 正式環境 `.env` 設定五個 `SMTP_*` 變數（密碼由管理者自行填入）並重啟服務
- [x] 4.3 觸發一封實際信件（如密碼重設）驗證寄達、寄件人顯示為「啟動事工 <no-reply@activate.kuaglobal.org>」且未進垃圾信
