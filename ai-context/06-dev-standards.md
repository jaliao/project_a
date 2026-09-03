# 6. 開發規範

> 屬於 [README-AI.md](../README-AI.md) 拆分章節，回索引請見該檔。

- **語言**：繁體中文（註解、文件）
- **元件預設**：Server Component，僅互動部分加 `"use client"`
- **資料查詢**：`lib/data/`（多處複用）或 Server Action 直接 Prisma（單一用途）
- **表單**：Zod schema → React Hook Form → Server Action → ActionResponse → Sonner toast
- **通知整合**：關鍵操作（開課完成、取消課程、學員核准、課程結業）成功後以 fire-and-forget 呼叫 `createNotification`，同步寫入 Inbox；toast 呈現不變
- **外寄信件收件人**：對使用者的外寄信一律以 `resolveContactEmail(user)`（`lib/utils/contact-email.ts`）決定收件地址 —— 優先已驗證通訊 Email（`isCommVerified && commEmail`），否則帳號 `email`；通訊 Email 驗證信本身為例外，仍寄至待驗證地址
- **SMTP 傳輸**：`lib/mailer.ts` 單例 Nodemailer，完全由 `SMTP_HOST/PORT/USER/PASS/FROM` 環境變數驅動（port 465 implicit TLS、其餘 STARTTLS），寄件人顯示「啟動事工 <SMTP_FROM>」；正式環境採 Mailchimp Transactional（Mandrill）：`smtp.mandrillapp.com:587`、帳號 `notice@kuaglobal.org`、寄件人 `no-reply@activate.kuaglobal.org`（網域須完成 SPF/DKIM），`SMTP_PASS`＝Mandrill API key、不進版控
- **版本**：`config/version.json` 為唯一來源（patch +1 per `/opsx:apply`，`updatedAt` 同步更新）；登入後頁面 Footer（`components/layout/footer.tsx`）顯示 `v{version} · {updatedAt}`
- **i18n（next-intl）**：`messages/zh-TW.json` 為唯一事實來源、`messages/en.json` 補英文、`messages/zh-CN.json` 由 `npm run gen:zh-cn` 產生；元件不寫死語言字串，server 用 `getTranslations`、client 用 `useTranslations`；缺 key 逐層回退繁體。已在地化範圍：未登入流程頁、通知/邀請/查經/媒合等小型會員頁、共用字串、驗證訊息、課程與會員入口，**個人資料頁（`/user/[spiritId]/profile` 及其子元件、相關 server action toast，`profile` 命名空間，cr-spec-260903-001）**
- **Prisma import**：`@prisma/client`（tsconfig paths 已設定）
