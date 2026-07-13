# Tasks — 略過 seed 合成信箱的外寄信件

## 1. Mailer 守門

- [x] 1.1 `lib/mailer.ts`：新增 `SYNTHETIC_EMAIL_DOMAIN` 常數與匯出的 `isUndeliverableEmail(email)`（trim＋小寫化後 `endsWith` 判定）
- [x] 1.2 `lib/mailer.ts`：新增內部 `sendMailSafe`（命中合成網域→`console.info` 記略過並 return；否則 `transporter.sendMail`），五個寄信函式改走 `sendMailSafe`

## 2. 驗證與收尾

- [x] 2.1 `npm run lint` 與 `npm run build` 通過
- [x] 2.2 以 node 直接驗證 `isUndeliverableEmail`：`pa260991@seed.iwillshare.org.tw`／大寫變體 → true；`user@gmail.com`／`a@iwillshare.org.tw` → false
- [x] 2.3 手動驗證：對 seed 學員課程執行結業確認，流程成功、log 出現略過訊息、無退信
- [x] 2.4 `doc/管理者操作手冊.md` 加註 seed 名冊帳號（合成信箱）不寄系統信、驗證通訊 Email 後恢復；檔首版本與日期更新
- [x] 2.5 `config/version.json` patch +1、`updatedAt` 更新；`README-AI.md` 版本與「已完成」清單更新
