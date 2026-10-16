## Context

`lib/mailer.ts` 所有外寄信件皆經由單一守門函式 `sendMailSafe` 送出（見 `mail-skip-synthetic` spec）：目前邏輯僅判定收件地址是否為合成 seed 網域（`isUndeliverableEmail`），命中則略過、不發 SMTP 請求。

dev／test／正式三個環境共用同一套程式碼與 `lib/mailer.ts` 邏輯，差異僅在各自 host 的 `.env`（`SMTP_HOST` 等）。目前 dev／test 的 `SMTP_HOST` 接的是正式可用的 Brevo relay，且多數測試資料（`prisma/seed.ts` 匯入的名冊）是真實姓名與真實 email，沒有合成網域保護，也沒有 `commEmail` 覆寫。

## Goals / Non-Goals

**Goals:**
- dev／test 環境下，任何寄信呼叫（不論收件地址是真人信箱還是測試信箱）最終都只送達指定的覆寫信箱。
- 正式環境行為完全不變，不新增任何風險或延遲。
- 覆寫邏輯集中在 `sendMailSafe` 一處，所有既有與未來新增的寄信函式自動套用，不需逐一修改呼叫端。

**Non-Goals:**
- 不處理「如何判斷目前是哪個環境」的通用機制（不新增 `APP_ENV` 之類的全域變數），僅以『該變數有無設定值』作為開關，理由見 Decisions。
- 不改變合成 seed 網域既有的「略過不寄」行為。
- 不提供後台可調整的覆寫信箱設定（UI/admin-settings），覆寫信箱僅透過環境變數設定，變更需改 `.env` 並重啟服務。

## Decisions

- **用專屬環境變數 `MAIL_OVERRIDE_TO` 當開關，不用 `NODE_ENV`。**
  理由：test/staging 環境的建置方式是正式 production build（`NODE_ENV=production`），單純檢查 `NODE_ENV !== 'production'` 無法涵蓋 test 環境；改用「該變數有無設定值」判斷，三個環境（dev/test/正式）各自的 `.env` 獨立控制，不需要額外推斷環境種類，也不會因為 `NODE_ENV` 設定方式不同而失效。
- **覆寫判定順序：合成 seed 網域略過 → 覆寫信箱 → 正常寄送。**
  理由：合成網域地址從未真正送達過（本來就是假信箱），不需要為它們再轉寄一次；覆寫只處理「原本會真的送出去」的那些信件。
- **覆寫時在信件主旨前加註原始收件地址（如 `[原收件人: xxx@yyy.com] 原主旨`），內文不變。**
  理由：主旨在信箱列表就看得到，比翻開內文才看到原收件人更利於測試時快速辨識；內文維持不變可避免影響既有信件模板的客製內容（如結業信的動態姓名、連結）。
- **覆寫信箱固定由環境變數值決定，不寫死在程式碼。**
  理由：不同測試情境或不同人測試時可各自在自己的 `.env` 指定收件信箱，不需要改程式碼。

## Risks / Trade-offs

- [忘記在正式環境確認 `.env` 沒有設定 `MAIL_OVERRIDE_TO`，可能導致正式信件也被覆寫] → `.env.example` 加註明顯警語（僅 dev/test 使用，正式環境不可設定）；部署文件（`doc/` 操作手冊非使用者可見範疇，暫以程式內註解與 `.env.example` 註解為主要防線）。
- [覆寫後主旨變長，部分信箱客戶端可能截斷顯示] → 可接受，測試情境以能辨識原收件人為優先。
