## 1. Mailer 覆寫邏輯

- [x] 1.1 `lib/mailer.ts`：`sendMailSafe` 新增 `MAIL_OVERRIDE_TO` 判定——合成 seed 網域略過規則優先；其次若 `MAIL_OVERRIDE_TO` 有設定非空值，改寄該信箱並於 `options.subject` 前加註 `[原收件人: {原地址}]`，記錄 log；皆未命中則照常寄送原地址。

## 2. 環境變數文件

- [x] 2.1 `.env.example`：新增 `MAIL_OVERRIDE_TO` 說明註解（選填；dev/test 用，正式環境不可設定）。

## 3. 版本

- [x] 3.1 `config/version.json` patch +1（0.1.216 → 0.1.217），`updatedAt` 維持當日日期（無使用者可見功能異動，故不更新 `doc/` 操作手冊）

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 與 `npm run build` 皆成功
- [x] 4.2 情境：設定 `MAIL_OVERRIDE_TO` 後呼叫既有寄信函式（任意收件地址）→ 實際收件地址為覆寫信箱、主旨含原收件地址註記
- [x] 4.3 情境：不設定 `MAIL_OVERRIDE_TO` → 行為與現況相同，直接寄給原收件地址
- [x] 4.4 情境：設定 `MAIL_OVERRIDE_TO` 且收件地址為 `@seed.iwillshare.org.tw` → 仍略過不寄，不改寄到覆寫信箱
