## 1. 修正

- [x] 1.1 `lib/mailer.ts` 的 `sendMailSafe()`：
  - 新增 `describeRecipients(options)` helper：組出 `to`（必有）＋ 若有 `cc`/`bcc` 則附加 `; cc: {cc}`／`; bcc: {bcc}`（`cc`/`bcc` 可能是 string 或 array，需 `String()` 轉為可讀字串）。
  - `MAIL_OVERRIDE_TO` 生效分支：主旨註記改用 `describeRecipients(options)` 取代目前單純的 `to` 字串；`transporter.sendMail` 呼叫時明確設 `cc: undefined, bcc: undefined`（連同 `to: MAIL_OVERRIDE_TO`）。

## 2. 版本號

- [x] 2.1 `config/version.json` patch +1，`updatedAt` 更新為當日日期。

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 3.2 情境：設定 `MAIL_OVERRIDE_TO` 時，無 `cc`/`bcc` 的既有呼叫端（目前所有既有寄信函式皆無 `cc`/`bcc`）行為不變。（mock `transporter.sendMail` 實測 `sendTempPasswordEmail`：`to` 改寄 override 信箱、主旨正確加註原收件人、`cc`/`bcc` 皆為 `undefined`，PASS）
- [x] 3.3 情境：`MAIL_OVERRIDE_TO` 生效且選項含 `cc`/`bcc` 時，實際送出的參數不含 `cc`/`bcc`，主旨含原始 `cc`/`bcc` 地址註記。（`sendMailSafe` 為 module-private 無法直接 import 測試，以複製後的等價邏輯驗證：輸入 `cc`/`bcc` 後輸出 `to=override`、`cc`/`bcc` 皆為 `undefined`、主旨含 `; cc: ...; bcc: ...` 完整原始範圍，PASS）
- [x] 3.4 情境：合成 seed 信箱仍優先略過，不受本次改動影響。（`isUndeliverableEmail` 判定與其呼叫處完全未修改，僅覆寫分支內部邏輯變動，程式碼複查確認）
